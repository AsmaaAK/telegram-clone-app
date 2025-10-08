const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const { cloudinary } = require('../config/cloudinary');

// Get messages for a conversation
exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50, before } = req.query;
    const skip = (page - 1) * limit;

    // Verify user has access to conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user.userId
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Build query
    let query = { conversation: conversationId, deleted: false };
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .populate('sender', 'name username avatar')
      .populate('receiver', 'name username avatar')
      .populate('replyTo', 'content sender type')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Reverse to get chronological order
    messages.reverse();

    const total = await Message.countDocuments(query);

    res.json({
      success: true,
      messages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
        hasMore: skip + messages.length < total
      }
    });

  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Send message
exports.sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content, type = 'text', replyTo } = req.body;

    // Verify conversation exists and user has access
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user.userId
    }).populate('participants', 'blockedUsers');

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Check if conversation is blocked (for private chats)
    if (conversation.type === 'private') {
      const otherParticipant = conversation.participants.find(
        p => p._id.toString() !== req.user.userId
      );
      
      if (conversation.isBlocked || 
          otherParticipant.blockedUsers.includes(req.user.userId)) {
        return res.status(403).json({
          success: false,
          message: 'Cannot send message to blocked user'
        });
      }
    }

    // Create message
    const messageData = {
      conversation: conversationId,
      sender: req.user.userId,
      type,
      content: { text: content }
    };

    // Add receiver for private messages
    if (conversation.type === 'private') {
      const receiver = conversation.participants.find(
        p => p._id.toString() !== req.user.userId
      );
      messageData.receiver = receiver._id;
    }

    // Add reply reference if provided
    if (replyTo) {
      const repliedMessage = await Message.findOne({
        _id: replyTo,
        conversation: conversationId
      });
      
      if (repliedMessage) {
        messageData.replyTo = replyTo;
      }
    }

    const message = await Message.create(messageData);
    await message.populate('sender', 'name username avatar');
    await message.populate('receiver', 'name username avatar');
    await message.populate('replyTo', 'content sender type');

    // Update conversation last message and timestamp
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = new Date();

    // Increment unread counts for all participants except sender
    conversation.participants.forEach(participant => {
      if (participant._id.toString() !== req.user.userId) {
        const currentCount = conversation.unreadCounts.get(participant._id.toString()) || 0;
        conversation.unreadCounts.set(participant._id.toString(), currentCount + 1);
      }
    });

    await conversation.save();

    // Emit real-time event (handled in socket service)
    req.app.get('io').to(conversationId).emit('message:new', message);

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: message
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Upload file and send as message
exports.uploadFile = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { type = 'file' } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Verify conversation exists and user has access
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user.userId
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Upload to Cloudinary
    const folder = type === 'image' ? 'telegram-clone/images' : 'telegram-clone/files';
    
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder,
      resource_type: 'auto',
      quality: 'auto'
    });

    // Create message with file
    const messageData = {
      conversation: conversationId,
      sender: req.user.userId,
      type,
      content: {
        media: {
          url: result.secure_url,
          filename: req.file.originalname,
          size: req.file.size,
          mimeType: req.file.mimetype
        }
      }
    };

    // Add receiver for private messages
    if (conversation.type === 'private') {
      const receiver = conversation.participants.find(
        p => p._id.toString() !== req.user.userId
      );
      messageData.receiver = receiver._id;
    }

    const message = await Message.create(messageData);
    await message.populate('sender', 'name username avatar');
    await message.populate('receiver', 'name username avatar');

    // Update conversation
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = new Date();

    // Increment unread counts
    conversation.participants.forEach(participant => {
      if (participant._id.toString() !== req.user.userId) {
        const currentCount = conversation.unreadCounts.get(participant._id.toString()) || 0;
        conversation.unreadCounts.set(participant._id.toString(), currentCount + 1);
      }
    });

    await conversation.save();

    // Emit real-time event
    req.app.get('io').to(conversationId).emit('message:new', message);

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: message
    });

  } catch (error) {
    console.error('Upload file error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during file upload'
    });
  }
};

// Edit message
exports.editMessage = async (req, res) => {
  try {
    const { conversationId, messageId } = req.params;
    const { content } = req.body;

    const message = await Message.findOne({
      _id: messageId,
      conversation: conversationId,
      sender: req.user.userId
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found or you are not the sender'
      });
    }

    // Only text messages can be edited
    if (message.type !== 'text') {
      return res.status(400).json({
        success: false,
        message: 'Only text messages can be edited'
      });
    }

    // Update message
    message.content.text = content;
    message.edited = true;
    await message.save();

    await message.populate('sender', 'name username avatar');
    await message.populate('receiver', 'name username avatar');

    // Emit update event
    req.app.get('io').to(conversationId).emit('message:updated', message);

    res.json({
      success: true,
      message: 'Message updated successfully',
      data: message
    });

  } catch (error) {
    console.error('Edit message error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Delete message (soft delete)
exports.deleteMessage = async (req, res) => {
  try {
    const { conversationId, messageId } = req.params;

    const message = await Message.findOne({
      _id: messageId,
      conversation: conversationId,
      sender: req.user.userId
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found or you are not the sender'
      });
    }

    // Soft delete
    message.deleted = true;
    await message.save();

    // Emit delete event
    req.app.get('io').to(conversationId).emit('message:deleted', {
      messageId: message._id,
      conversationId
    });

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });

  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};