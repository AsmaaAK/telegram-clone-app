const Channel = require('../models/Channel');
const ChannelMessage = require('../models/ChannelMessage');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
      destination: (req, file, cb) => {
            const uploadPath = path.join(__dirname, '..', '..', 'uploads');
            if (!fs.existsSync(uploadPath)) {
                  fs.mkdirSync(uploadPath, { recursive: true });
            }
            cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, 'channel_' + uniqueSuffix + path.extname(file.originalname));
      }
});

const upload = multer({
      storage,
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
      fileFilter: (req, file, cb) => {
            const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|mp4|mp3/;
            const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
            const mimetype = allowedTypes.test(file.mimetype);

            if (mimetype && extname) {
                  return cb(null, true);
            } else {
                  cb(new Error('Invalid file type'));
            }
      }
});

class ChannelsController {
      // Get upload middleware
      static getUploadMiddleware() {
            return upload;
      }

      // Create a new channel
      static async createChannel(req, res) {
            try {
                  const { name, description } = req.body;
                  const userId = req.user.id;

                  if (!name || name.trim().length === 0) {
                        return res.status(400).json({
                              message: 'Channel name is required',
                              code: 'VALIDATION_ERROR'
                        });
                  }

                  const channelData = {
                        name: name.trim(),
                        description: description?.trim() || '',
                        owner: userId,
                        subscribers: [userId],
                        isActive: true
                  };

                  // Handle avatar upload if present
                  if (req.file) {
                        channelData.avatarUrl = `/uploads/${req.file.filename}`;
                  }

                  const channel = new Channel(channelData);
                  await channel.save();

                  await channel.populate('owner', 'name username avatarUrl');
                  await channel.populate('subscribers', 'name username avatarUrl');

                  const channelWithFlags = {
                        ...channel.toObject(),
                        _id: channel._id,
                        isOwner: true,
                        isSubscriber: true,
                        subscriberCount: channel.subscribers.length,
                        latestMessage: null,
                        isActive: channel.isActive
                  };

                  // Emit channel creation event via Socket.io
                  req.app.get('io').emit('channel:created', channelWithFlags);

                  res.status(201).json(channelWithFlags);
            } catch (error) {
                  console.error('Error creating channel:', error);
                  res.status(500).json({ message: 'Server error', code: 'SERVER_ERROR' });
            }
      }

      // Get all channels
      static async getAllChannels(req, res) {
            try {
                  const userId = req.user.id;

                  // Get all channels (available to everyone)
                  const allChannels = await Channel.find()
                        .populate('owner', 'name username avatarUrl')
                        .populate('subscribers', 'name username avatarUrl')
                        .sort({ createdAt: -1 });

                  console.log(`📺 Fetching channels for user ${userId}: Found ${allChannels.length} channels`);
                  allChannels.forEach(channel => {
                        console.log(`  - ${channel.name} (owner: ${channel.owner?.name}, subscribers: ${channel.subscribers?.length || 0})`);
                  });

                  // Get latest message for each channel
                  const channelsWithLatestMessage = await Promise.all(
                        allChannels.map(async (channel) => {
                              const latestMessage = await ChannelMessage.findLatestByChannel(channel._id);
                              const isOwner = channel.owner._id.toString() === userId;
                              const isSubscriber = channel.subscribers.some(sub => sub._id.toString() === userId);

                              return {
                                    ...channel.toObject(),
                                    latestMessage,
                                    isOwner,
                                    isSubscriber,
                                    isAvailable: true,
                                    subscriberCount: channel.subscribers.length
                              };
                        })
                  );

                  console.log(`📺 Returning ${channelsWithLatestMessage.length} channels to user ${userId}`);
                  res.json(channelsWithLatestMessage);
            } catch (error) {
                  console.error('Error fetching channels:', error);
                  res.status(500).json({ message: 'Server error', code: 'SERVER_ERROR' });
            }
      }

      // Get channel by ID
      static async getChannelById(req, res) {
            try {
                  const channelId = req.params.id;
                  const userId = req.user.id;

                  const channel = await Channel.findOne({ _id: channelId, isActive: true })
                        .populate('owner', 'name username avatarUrl')
                        .populate('subscribers', 'name username avatarUrl');

                  if (!channel) {
                        return res.status(404).json({
                              message: 'Channel not found',
                              code: 'CHANNEL_NOT_FOUND'
                        });
                  }

                  const isSubscriber = channel.isSubscriber(userId);
                  const isOwner = channel.owner._id.toString() === userId;

                  console.log(`📺 Channel ${channel.name} details access - User: ${userId}, isOwner: ${isOwner}, isSubscriber: ${isSubscriber}`);

                  res.json({
                        ...channel.toObject(),
                        isOwner,
                        isSubscriber
                  });
            } catch (error) {
                  console.error('Error fetching channel details:', error);
                  res.status(500).json({ message: 'Server error', code: 'SERVER_ERROR' });
            }
      }

      // Update channel
      static async updateChannel(req, res) {
            try {
                  const channelId = req.params.id;
                  const userId = req.user.id;
                  const { name, description } = req.body;

                  const channel = await Channel.findOne({ _id: channelId, owner: userId, isActive: true });

                  if (!channel) {
                        return res.status(404).json({
                              message: 'Channel not found or access denied',
                              code: 'CHANNEL_NOT_FOUND'
                        });
                  }

                  if (name && name.trim().length > 0) {
                        channel.name = name.trim();
                  }
                  if (description !== undefined) {
                        channel.description = description?.trim() || '';
                  }

                  // Handle avatar upload if present
                  if (req.file) {
                        channel.avatarUrl = `/uploads/${req.file.filename}`;
                  }

                  await channel.save();
                  await channel.populate('owner', 'name username avatarUrl');
                  await channel.populate('subscribers', 'name username avatarUrl');

                  res.json({
                        channel: {
                              ...channel.toObject(),
                              isOwner: true,
                              isSubscriber: channel.isSubscriber(userId)
                        }
                  });
            } catch (error) {
                  console.error('Error updating channel:', error);
                  res.status(500).json({ message: 'Server error', code: 'SERVER_ERROR' });
            }
      }

      // Delete channel
      static async deleteChannel(req, res) {
            try {
                  const channelId = req.params.id;
                  const userId = req.user.id;

                  const channel = await Channel.findOne({ _id: channelId, owner: userId, isActive: true });

                  if (!channel) {
                        return res.status(404).json({
                              message: 'Channel not found or access denied',
                              code: 'CHANNEL_NOT_FOUND'
                        });
                  }

                  // Soft delete by setting isActive to false
                  channel.isActive = false;
                  await channel.save();

                  res.json({ message: 'Channel deleted successfully' });
            } catch (error) {
                  console.error('Error deleting channel:', error);
                  res.status(500).json({ message: 'Server error', code: 'SERVER_ERROR' });
            }
      }

      // Subscribe to channel
      static async subscribeToChannel(req, res) {
            try {
                  const channelId = req.params.id;
                  const userId = req.user.id;

                  const channel = await Channel.findOne({ _id: channelId, isActive: true });

                  if (!channel) {
                        return res.status(404).json({
                              message: 'Channel not found',
                              code: 'CHANNEL_NOT_FOUND'
                        });
                  }

                  if (channel.isSubscriber(userId)) {
                        return res.status(400).json({
                              message: 'Already subscribed to this channel',
                              code: 'ALREADY_SUBSCRIBED'
                        });
                  }

                  channel.subscribers.push(userId);
                  await channel.save();

                  await channel.populate('owner', 'name username avatarUrl');
                  await channel.populate('subscribers', 'name username avatarUrl');

                  res.json({
                        message: 'Successfully subscribed to channel',
                        channel: {
                              ...channel.toObject(),
                              isOwner: channel.owner._id.toString() === userId,
                              isSubscriber: true
                        }
                  });
            } catch (error) {
                  console.error('Error subscribing to channel:', error);
                  res.status(500).json({ message: 'Server error', code: 'SERVER_ERROR' });
            }
      }

      // Unsubscribe from channel
      static async unsubscribeFromChannel(req, res) {
            try {
                  const channelId = req.params.id;
                  const userId = req.user.id;

                  const channel = await Channel.findOne({ _id: channelId, isActive: true });

                  if (!channel) {
                        return res.status(404).json({
                              message: 'Channel not found',
                              code: 'CHANNEL_NOT_FOUND'
                        });
                  }

                  if (!channel.isSubscriber(userId)) {
                        return res.status(400).json({
                              message: 'Not subscribed to this channel',
                              code: 'NOT_SUBSCRIBED'
                        });
                  }

                  // Owner cannot unsubscribe from their own channel
                  if (channel.owner.toString() === userId) {
                        return res.status(400).json({
                              message: 'Channel owner cannot unsubscribe from their own channel',
                              code: 'OWNER_CANNOT_UNSUBSCRIBE'
                        });
                  }

                  channel.subscribers = channel.subscribers.filter(subId => subId.toString() !== userId);
                  await channel.save();

                  res.json({ message: 'Successfully unsubscribed from channel' });
            } catch (error) {
                  console.error('Error unsubscribing from channel:', error);
                  res.status(500).json({ message: 'Server error', code: 'SERVER_ERROR' });
            }
      }

      // Send message to channel
      static async sendChannelMessage(req, res) {
            try {
                  const channelId = req.params.id;
                  const userId = req.user.id;
                  const { content, type = 'text' } = req.body;

                  const channel = await Channel.findOne({ _id: channelId, isActive: true });

                  if (!channel) {
                        return res.status(404).json({
                              message: 'Channel not found',
                              code: 'CHANNEL_NOT_FOUND'
                        });
                  }

                  // Only owner can send messages
                  if (channel.owner.toString() !== userId) {
                        return res.status(403).json({
                              message: 'Only channel owner can send messages',
                              code: 'ACCESS_DENIED'
                        });
                  }

                  let messageData = {
                        channel: channelId,
                        sender: userId,
                        type
                  };

                  if (type === 'text' || type === 'system') {
                        if (!content || content.trim().length === 0) {
                              return res.status(400).json({
                                    message: 'Message content is required',
                                    code: 'VALIDATION_ERROR'
                              });
                        }
                        messageData.content = content.trim();
                  } else if (type === 'file' && req.file) {
                        messageData.fileUrl = `/uploads/${req.file.filename}`;
                        messageData.fileName = req.file.originalname;
                        messageData.content = req.file.originalname; // Use filename as content for display
                  } else if (type === 'file') {
                        return res.status(400).json({
                              message: 'File is required for file messages',
                              code: 'VALIDATION_ERROR'
                        });
                  }

                  const message = new ChannelMessage(messageData);
                  await message.save();

                  await message.populate('sender', 'name username avatarUrl');

                  // Emit to socket for real-time updates
                  req.app.get('io').to(`channel:${channelId}`).emit('channel_message', message);

                  res.status(201).json(message);
            } catch (error) {
                  console.error('Error sending channel message:', error);
                  res.status(500).json({ message: 'Server error', code: 'SERVER_ERROR' });
            }
      }

      // Get channel messages
      static async getChannelMessages(req, res) {
            try {
                  const channelId = req.params.id;
                  const userId = req.user.id;
                  const limit = parseInt(req.query.limit) || 50;
                  const offset = parseInt(req.query.offset) || 0;

                  const channel = await Channel.findOne({ _id: channelId, isActive: true });

                  if (!channel) {
                        return res.status(404).json({
                              message: 'Channel not found',
                              code: 'CHANNEL_NOT_FOUND'
                        });
                  }

                  // Check if user is subscribed or owner
                  const isSubscriber = channel.isSubscriber(userId);
                  const isOwner = channel.owner.toString() === userId;

                  console.log(`📺 Channel ${channel.name} messages access - User: ${userId}, isOwner: ${isOwner}, isSubscriber: ${isSubscriber}`);

                  const messages = await ChannelMessage.findByChannel(channelId, limit, offset);

                  res.json(messages.reverse());
            } catch (error) {
                  console.error('Error fetching channel messages:', error);
                  res.status(500).json({ message: 'Server error', code: 'SERVER_ERROR' });
            }
      }
}

module.exports = ChannelsController;

