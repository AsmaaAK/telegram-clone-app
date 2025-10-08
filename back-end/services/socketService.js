const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

// Store connected users
const connectedUsers = new Map();

const handleConnection = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      // Verify token (you'll need to implement this based on your auth system)
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const user = await User.findById(decoded.userId);
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId}`);

    // Add user to connected users
    connectedUsers.set(socket.userId, {
      socketId: socket.id,
      user: socket.user,
      joinedAt: new Date()
    });

    // Mark user as online
    User.findByIdAndUpdate(socket.userId, {
      status: 'online',
      isOnline: true,
      lastSeen: new Date()
    }).catch(console.error);

    // Notify others that user is online
    socket.broadcast.emit('user:online', {
      userId: socket.userId,
      user: {
        _id: socket.user._id,
        name: socket.user.name,
        username: socket.user.username,
        avatar: socket.user.avatar
      }
    });

    // Join user to their personal room
    socket.join(`user:${socket.userId}`);

    // Join user to their conversation rooms
    const joinUserConversations = async () => {
      try {
        const conversations = await Conversation.find({
          participants: socket.userId
        });
        
        conversations.forEach(conv => {
          socket.join(`conversation:${conv._id}`);
        });
      } catch (error) {
        console.error('Error joining conversation rooms:', error);
      }
    };

    joinUserConversations();

    // Handle joining a specific conversation
    socket.on('conversation:join', (conversationId) => {
      socket.join(`conversation:${conversationId}`);
      console.log(`User ${socket.userId} joined conversation: ${conversationId}`);
    });

    // Handle leaving a conversation
    socket.on('conversation:leave', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
      console.log(`User ${socket.userId} left conversation: ${conversationId}`);
    });

    // Handle sending messages
    socket.on('message:send', async (data) => {
      try {
        const { conversationId, content, type = 'text', replyTo } = data;

        // Verify user has access to conversation
        const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: socket.userId
        }).populate('participants', 'blockedUsers');

        if (!conversation) {
          socket.emit('message:error', {
            message: 'Conversation not found or access denied',
            code: 'NOT_FOUND'
          });
          return;
        }

        // Check if conversation is blocked
        if (conversation.type === 'private') {
          const otherParticipant = conversation.participants.find(
            p => p._id.toString() !== socket.userId
          );
          
          if (conversation.isBlocked || 
              otherParticipant.blockedUsers.includes(socket.userId)) {
            socket.emit('message:error', {
              message: 'Cannot send message to blocked user',
              code: 'BLOCKED'
            });
            return;
          }
        }

        // Create message
        const messageData = {
          conversation: conversationId,
          sender: socket.userId,
          type,
          content: { text: content }
        };

        // Add receiver for private messages
        if (conversation.type === 'private') {
          const receiver = conversation.participants.find(
            p => p._id.toString() !== socket.userId
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

        // Update conversation
        conversation.lastMessage = message._id;
        conversation.lastMessageAt = new Date();

        // Increment unread counts for all participants except sender
        conversation.participants.forEach(participant => {
          if (participant._id.toString() !== socket.userId) {
            const currentCount = conversation.unreadCounts.get(participant._id.toString()) || 0;
            conversation.unreadCounts.set(participant._id.toString(), currentCount + 1);
          }
        });

        await conversation.save();

        // Emit to all participants in the conversation
        io.to(`conversation:${conversationId}`).emit('message:new', message);

        // Send delivery confirmation to sender
        socket.emit('message:delivered', {
          messageId: message._id,
          conversationId
        });

      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('message:error', {
          message: 'Failed to send message',
          code: 'SERVER_ERROR'
        });
      }
    });

    // Handle typing indicators
    socket.on('typing:start', async (data) => {
      try {
        const { conversationId, userId } = data;
        
        // Verify user has access to conversation
        const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: socket.userId
        });

        if (conversation) {
          // Notify other participants in the conversation
          socket.to(`conversation:${conversationId}`).emit('user:typing', {
            conversationId,
            userId: socket.userId,
            isTyping: true,
            user: {
              _id: socket.user._id,
              name: socket.user.name,
              username: socket.user.username
            }
          });
        }
      } catch (error) {
        console.error('Error handling typing start:', error);
      }
    });

    socket.on('typing:stop', async (data) => {
      try {
        const { conversationId } = data;
        
        const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: socket.userId
        });

        if (conversation) {
          socket.to(`conversation:${conversationId}`).emit('user:typing', {
            conversationId,
            userId: socket.userId,
            isTyping: false
          });
        }
      } catch (error) {
        console.error('Error handling typing stop:', error);
      }
    });

    // Handle message read receipts
    socket.on('message:read', async (data) => {
      try {
        const { conversationId, messageIds } = data;

        const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: socket.userId
        });

        if (conversation) {
          // Mark messages as read
          await Message.updateMany(
            {
              _id: { $in: messageIds },
              conversation: conversationId,
              readBy: { $ne: socket.userId }
            },
            {
              $addToSet: { readBy: socket.userId },
              status: 'read'
            }
          );

          // Reset unread count for current user
          conversation.unreadCounts.set(socket.userId.toString(), 0);
          await conversation.save();

          // Notify other participants
          socket.to(`conversation:${conversationId}`).emit('messages:read', {
            conversationId,
            userId: socket.userId,
            messageIds
          });
        }
      } catch (error) {
        console.error('Error handling message read:', error);
      }
    });

    // Handle voice call signaling
    socket.on('call:initiate', (data) => {
      const { toUserId, offer } = data;
      
      // Notify the recipient
      socket.to(`user:${toUserId}`).emit('call:incoming', {
        fromUserId: socket.userId,
        fromUser: {
          _id: socket.user._id,
          name: socket.user.name,
          username: socket.user.username,
          avatar: socket.user.avatar
        },
        offer
      });
    });

    socket.on('call:answer', (data) => {
      const { toUserId, answer } = data;
      
      // Send answer to the caller
      socket.to(`user:${toUserId}`).emit('call:answered', {
        fromUserId: socket.userId,
        answer
      });
    });

    socket.on('call:ice-candidate', (data) => {
      const { toUserId, candidate } = data;
      
      // Relay ICE candidate
      socket.to(`user:${toUserId}`).emit('call:ice-candidate', {
        fromUserId: socket.userId,
        candidate
      });
    });

    socket.on('call:end', (data) => {
      const { toUserId } = data;
      
      // Notify the other user
      socket.to(`user:${toUserId}`).emit('call:ended', {
        fromUserId: socket.userId
      });
    });

    // Handle disconnection
    socket.on('disconnect', async (reason) => {
      console.log(`User disconnected: ${socket.userId} - Reason: ${reason}`);

      // Remove user from connected users
      connectedUsers.delete(socket.userId);

      // Mark user as offline
      try {
        await User.findByIdAndUpdate(socket.userId, {
          status: 'offline',
          isOnline: false,
          lastSeen: new Date()
        });

        // Notify others that user went offline
        socket.broadcast.emit('user:offline', {
          userId: socket.userId,
          lastSeen: new Date()
        });
      } catch (error) {
        console.error('Error updating user status on disconnect:', error);
      }
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });
};

// Utility functions
const getConnectedUsers = () => {
  return Array.from(connectedUsers.values()).map(conn => ({
    userId: conn.user._id,
    socketId: conn.socketId,
    user: conn.user,
    joinedAt: conn.joinedAt
  }));
};

const getUserSocket = (userId) => {
  return connectedUsers.get(userId);
};

const isUserOnline = (userId) => {
  return connectedUsers.has(userId);
};

const sendToUser = (userId, event, data) => {
  const userConnection = connectedUsers.get(userId);
  if (userConnection) {
    io.to(userConnection.socketId).emit(event, data);
    return true;
  }
  return false;
};

const broadcastToConversation = (conversationId, event, data) => {
  io.to(`conversation:${conversationId}`).emit(event, data);
};

module.exports = {
  handleConnection,
  getConnectedUsers,
  getUserSocket,
  isUserOnline,
  sendToUser,
  broadcastToConversation
};