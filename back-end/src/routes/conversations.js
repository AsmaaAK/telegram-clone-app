const express = require('express');
const { body, validationResult } = require('express-validator');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const { authRequired } = require('../middlewares/auth');

const router = express.Router();

// create/get conversation between two users
router.post('/', authRequired, [body('participantId').isString()], async (req, res, next) => {
      try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) return res.status(400).json({ message: 'Validation error', code: 'VALIDATION_ERROR', errors: errors.array() });
            const { participantId } = req.body;
            if (participantId === req.user.id) return res.status(400).json({ message: 'Cannot converse with self', code: 'BAD_REQUEST' });
            const participant = await User.findById(participantId);
            if (!participant) return res.status(404).json({ message: 'User not found', code: 'NOT_FOUND' });
            const existing = await Conversation.findOne({ participants: { $all: [req.user.id, participantId], $size: 2 } });
            if (existing) return res.json(existing);
            const convo = await Conversation.create({ participants: [req.user.id, participantId] });
            res.status(201).json(convo);
      } catch (e) {
            next(e);
      }
});

router.get('/', authRequired, async (req, res, next) => {
      try {
            const convos = await Conversation.find({ participants: req.user.id }).sort({ updatedAt: -1 });
            res.json(convos);
      } catch (e) {
            next(e);
      }
});

// Get conversation messages
router.get('/:id/messages', authRequired, async (req, res, next) => {
      try {
            const Message = require('../models/Message');
            const convo = await Conversation.findById(req.params.id);
            if (!convo) return res.status(404).json({ message: 'Conversation not found', code: 'NOT_FOUND' });
            if (!convo.participants.find((p) => p.toString() === req.user.id)) {
                  return res.status(403).json({ message: 'Not a participant', code: 'FORBIDDEN' });
            }
            const messages = await Message.find({ conversationId: req.params.id }).sort({ createdAt: 1 });
            res.json(messages);
      } catch (e) {
            next(e);
      }
});

// Send message to conversation
router.post('/:id/messages', authRequired, async (req, res, next) => {
      try {
            const Message = require('../models/Message');
            const { content, type = 'text' } = req.body;
            const convo = await Conversation.findById(req.params.id);
            if (!convo) return res.status(404).json({ message: 'Conversation not found', code: 'NOT_FOUND' });
            if (!convo.participants.find((p) => p.toString() === req.user.id)) {
                  return res.status(403).json({ message: 'Not a participant', code: 'FORBIDDEN' });
            }
            const message = await Message.create({
                  conversationId: req.params.id,
                  senderId: req.user.id,
                  content,
                  type
            });
            await message.populate('senderId', 'name username avatarUrl');
            res.status(201).json(message);
      } catch (e) {
            next(e);
      }
});

// Mark conversation as read (clear unread count)
router.post('/:id/read', authRequired, async (req, res, next) => {
      try {
            const convo = await Conversation.findById(req.params.id);
            if (!convo) return res.status(404).json({ message: 'Conversation not found', code: 'NOT_FOUND' });
            if (!convo.participants.find((p) => p.toString() === req.user.id)) {
                  return res.status(403).json({ message: 'Not a participant', code: 'FORBIDDEN' });
            }
            // Clear unread count for this user
            convo.unreadCounts.set(req.user.id, 0);
            await convo.save();
            res.json({ message: 'Marked as read', unreadCount: 0 });
      } catch (e) {
            next(e);
      }
});

module.exports = router;


