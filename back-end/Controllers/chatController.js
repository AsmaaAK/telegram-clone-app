const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');

// Get all conversations for current user
exports.getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user.userId
    })
    .populate('participants', 'name username avatar status lastSeen')
    .populate('lastMessage')
    .sort({ lastMessageAt: -1 });

    // Calculate unread counts for current user
    const conversationsWithUnread = conversations.map(conv => {
      const unreadCount = conv.unreadCounts.get(req.user.userId.toString()) || 0;
      return {
        ...conv.toObject(),
        unreadCounts: {
          [req.user.userId]: unreadCount
        }
      };
    });

    res.json({
      success: true,
      conversations: conversationsWithUnread
    });

  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get specific conversation
exports.getConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user.userId
    })
    .populate('participants', 'name username avatar status lastSeen blockedUsers')
    .populate('lastMessage');

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Check if conversation is blocked
    const currentUser = conversation.participants.find(
      p => p._id.toString() === req.user.userId
    );
    const otherUser = conversation.participants.find(
      p => p._id.toString() !== req.user.userId
    );

    if (conversation.type === 'private' && otherUser) {
      const isBlocked = currentUser.blockedUsers.includes(otherUser._id) ||
                       otherUser.blockedUsers.includes(req.user.userId);
      
      if (isBlocked) {
        return res.status(403).json({
          success: false,
          message: 'Cannot access this conversation'
        });
      }
    }

    res.json({
      success: true,
      conversation
    });

  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Create new conversation (private chat)
exports.createConversation = async (req, res) => {
  try {
    const { participantId } = req.body;

    if (!participantId) {
      return res.status(400).json({
        success: false,
        message: 'Participant ID is required'
      });
    }

    // Check if participant exists
    const participant = await User.findById(participantId);
    if (!participant) {
      return res.status(404).json({
        success: false,
        message: 'Participant not found'
      });
    }

    // Check if conversation already exists
    const existingConversation = await Conversation.findOne({
      type: 'private',
      participants: { $all: [req.user.userId, participantId] }
    })
    .populate('participants', 'name username avatar status lastSeen');

    if (existingConversation) {
      return res.json({
        success: true,
        message: 'Conversation already exists',
        conversation: existingConversation
      });
    }

    // Check if users are blocked
    const currentUser = await User.findById(req.user.userId);
    if (currentUser.blockedUsers.includes(participantId) ||
        participant.blockedUsers.includes(req.user.userId)) {
      return res.status(403).json({
        success: false,
        message: 'Cannot create conversation with blocked user'
      });
    }

    // Create new conversation
    const conversation = await Conversation.create({
      type: 'private',
      participants: [req.user.userId, participantId]
    });

    await conversation.populate('participants', 'name username avatar status lastSeen');

    res.status(201).json({
      success: true,
      message: 'Conversation created successfully',
      conversation
    });

  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Mark conversation as read
exports.markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;

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

    // Reset unread count for current user
    conversation.unreadCounts.set(req.user.userId.toString(), 0);
    await conversation.save();

    // Mark all messages as read
    await Message.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: req.user.userId },
        readBy: { $ne: req.user.userId }
      },
      {
        $addToSet: { readBy: req.user.userId },
        status: 'read'
      }
    );

    res.json({
      success: true,
      message: 'Conversation marked as read'
    });

  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Delete conversation
exports.deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;

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

    // For private chats, just remove the current user from participants
    if (conversation.type === 'private') {
      conversation.participants = conversation.participants.filter(
        p => p.toString() !== req.user.userId
      );
      
      if (conversation.participants.length === 0) {
        // Delete conversation and messages if no participants left
        await Message.deleteMany({ conversation: conversationId });
        await Conversation.findByIdAndDelete(conversationId);
      } else {
        await conversation.save();
      }
    } else {
      // For groups, handle differently (implement in group controller)
      return res.status(400).json({
        success: false,
        message: 'Use group endpoints for group conversations'
      });
    }

    res.json({
      success: true,
      message: 'Conversation deleted successfully'
    });

  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get conversation by participant (utility for frontend)
exports.getConversationByParticipant = async (req, res) => {
  try {
    const { participantId } = req.params;

    const conversation = await Conversation.findOne({
      type: 'private',
      participants: { $all: [req.user.userId, participantId] }
    })
    .populate('participants', 'name username avatar status lastSeen')
    .populate('lastMessage');

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    res.json({
      success: true,
      conversation
    });

  } catch (error) {
    console.error('Get conversation by participant error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};