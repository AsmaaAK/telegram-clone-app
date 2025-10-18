const express = require('express');
const { body, validationResult } = require('express-validator');
const { authRequired } = require('../middlewares/auth');
const MessagesController = require('../controllers/messagesController');

const router = express.Router();

// Get conversation messages
router.get('/:id/messages', authRequired, MessagesController.getConversationMessages);

// Send text message
router.post('/text',
      authRequired,
      [
            body('conversationId').notEmpty().withMessage('Conversation ID is required'),
            body('toUserId').notEmpty().withMessage('To user ID is required'),
            body('content').notEmpty().withMessage('Content is required')
      ],
      MessagesController.sendTextMessage
);

// Send file message
router.post('/file',
      authRequired,
      MessagesController.getUploadMiddleware().single('file'),
      MessagesController.sendFileMessage
);

// Mark messages as read
router.post('/read', authRequired, MessagesController.markMessagesAsRead);

// Delete message
router.delete('/:messageId', authRequired, MessagesController.deleteMessage);

// Edit message
router.put('/:messageId',
      authRequired,
      [body('content').notEmpty().withMessage('Content is required')],
      MessagesController.editMessage
);

module.exports = router;