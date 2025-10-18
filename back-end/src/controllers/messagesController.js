const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/User');

// Configure multer for file uploads
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
      destination: (req, file, cb) => {
            cb(null, uploadsDir);
      },
      filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, 'file_' + uniqueSuffix + path.extname(file.originalname));
      }
});

const upload = multer({
      storage,
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
      fileFilter: (req, file, cb) => {
            const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|mp4|mp3|txt/;
            const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
            const mimetype = allowedTypes.test(file.mimetype);

            if (mimetype && extname) {
                  return cb(null, true);
            } else {
                  cb(new Error('Invalid file type'));
            }
      }
});

class MessagesController {
      // Get upload middleware
      static getUploadMiddleware() {
            return upload;
      }

      // Get conversation messages
      static async getConversationMessages(req, res, next) {
            try {
                  const convId = req.params.id;
                  const msgs = await Message.find({ conversationId: convId }).sort({ createdAt: 1 });
                  res.json(msgs);
            } catch (e) {
                  next(e);
            }
      }

      // Send text message
      static async sendTextMessage(req, res, next) {
            try {
                  const errors = validationResult(req);
                  if (!errors.isEmpty()) {
                        return res.status(400).json({
                              message: 'Validation error',
                              code: 'VALIDATION_ERROR',
                              errors: errors.array()
                        });
                  }

                  const { conversationId, toUserId, content } = req.body;
                  const fromUserId = req.user.id;

                  // Verify conversation exists and user is participant
                  const conversation = await Conversation.findById(conversationId);
                  if (!conversation || !conversation.participants.includes(fromUserId)) {
                        return res.status(403).json({
                              message: 'Access denied to this conversation',
                              code: 'ACCESS_DENIED'
                        });
                  }

                  const message = new Message({
                        conversationId,
                        from: fromUserId,
                        to: toUserId,
                        content,
                        type: 'text'
                  });

                  await message.save();
                  await message.populate('from', 'name username avatarUrl');

                  // Emit message via Socket.io
                  req.app.get('io').to(`conversation:${conversationId}`).emit('message', message);

                  res.status(201).json(message);
            } catch (e) {
                  next(e);
            }
      }

      // Send file message
      static async sendFileMessage(req, res, next) {
            try {
                  if (!req.file) {
                        return res.status(400).json({ message: 'No file uploaded', code: 'NO_FILE' });
                  }

                  const { conversationId, toUserId } = req.body;
                  const fromUserId = req.user.id;

                  // Verify conversation exists and user is participant
                  const conversation = await Conversation.findById(conversationId);
                  if (!conversation || !conversation.participants.includes(fromUserId)) {
                        return res.status(403).json({
                              message: 'Access denied to this conversation',
                              code: 'ACCESS_DENIED'
                        });
                  }

                  const message = new Message({
                        conversationId,
                        from: fromUserId,
                        to: toUserId,
                        content: req.file.originalname,
                        type: 'file',
                        fileUrl: `/uploads/${req.file.filename}`,
                        fileName: req.file.originalname
                  });

                  await message.save();
                  await message.populate('from', 'name username avatarUrl');

                  // Emit message via Socket.io
                  req.app.get('io').to(`conversation:${conversationId}`).emit('message', message);

                  res.status(201).json(message);
            } catch (e) {
                  next(e);
            }
      }

      // Mark messages as read
      static async markMessagesAsRead(req, res, next) {
            try {
                  const { conversationId } = req.body;
                  const userId = req.user.id;

                  if (!conversationId) {
                        return res.status(400).json({
                              message: 'Conversation ID is required',
                              code: 'VALIDATION_ERROR'
                        });
                  }

                  // Update unread counts
                  await Message.updateMany(
                        { conversationId, to: userId, isRead: false },
                        { isRead: true }
                  );

                  // Update conversation unread counts
                  const conversation = await Conversation.findById(conversationId);
                  if (conversation) {
                        if (!conversation.unreadCounts) {
                              conversation.unreadCounts = {};
                        }
                        conversation.unreadCounts[userId] = 0;
                        await conversation.save();
                  }

                  res.json({ message: 'Messages marked as read' });
            } catch (e) {
                  next(e);
            }
      }

      // Delete message
      static async deleteMessage(req, res, next) {
            try {
                  const { messageId } = req.params;
                  const userId = req.user.id;

                  const message = await Message.findById(messageId);
                  if (!message) {
                        return res.status(404).json({
                              message: 'Message not found',
                              code: 'NOT_FOUND'
                        });
                  }

                  // Only sender can delete their own messages
                  if (message.from.toString() !== userId) {
                        return res.status(403).json({
                              message: 'Access denied',
                              code: 'ACCESS_DENIED'
                        });
                  }

                  // Delete file if it's a file message
                  if (message.type === 'file' && message.fileUrl) {
                        const filePath = path.join(__dirname, '..', '..', message.fileUrl);
                        if (fs.existsSync(filePath)) {
                              fs.unlinkSync(filePath);
                        }
                  }

                  await Message.findByIdAndDelete(messageId);

                  // Emit deletion event via Socket.io
                  req.app.get('io').to(`conversation:${message.conversationId}`).emit('message_deleted', messageId);

                  res.json({ message: 'Message deleted successfully' });
            } catch (e) {
                  next(e);
            }
      }

      // Edit message
      static async editMessage(req, res, next) {
            try {
                  const { messageId } = req.params;
                  const { content } = req.body;
                  const userId = req.user.id;

                  if (!content || content.trim().length === 0) {
                        return res.status(400).json({
                              message: 'Content is required',
                              code: 'VALIDATION_ERROR'
                        });
                  }

                  const message = await Message.findById(messageId);
                  if (!message) {
                        return res.status(404).json({
                              message: 'Message not found',
                              code: 'NOT_FOUND'
                        });
                  }

                  // Only sender can edit their own messages
                  if (message.from.toString() !== userId) {
                        return res.status(403).json({
                              message: 'Access denied',
                              code: 'ACCESS_DENIED'
                        });
                  }

                  // Only text messages can be edited
                  if (message.type !== 'text') {
                        return res.status(400).json({
                              message: 'Only text messages can be edited',
                              code: 'INVALID_MESSAGE_TYPE'
                        });
                  }

                  message.content = content.trim();
                  message.edited = true;
                  message.editedAt = new Date();
                  await message.save();

                  await message.populate('from', 'name username avatarUrl');

                  // Emit edit event via Socket.io
                  req.app.get('io').to(`conversation:${message.conversationId}`).emit('message_edited', message);

                  res.json(message);
            } catch (e) {
                  next(e);
            }
      }
}

module.exports = MessagesController;

