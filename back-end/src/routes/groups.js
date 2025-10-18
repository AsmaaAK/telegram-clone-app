const express = require('express');
const multer = require('multer');
const path = require('path');
const { authRequired } = require('../middlewares/auth');
const Group = require('../models/Group');
const GroupMessage = require('../models/GroupMessage');

const router = express.Router();

const storage = multer.diskStorage({
      destination: (req, file, cb) => cb(null, path.join(__dirname, '..', '..', 'uploads')),
      filename: (req, file, cb) => {
            const ext = path.extname(file.originalname);
            cb(null, `group_${Date.now()}${ext}`);
      }
});
const upload = multer({ storage });

function ensureAdminOrOwner(group, userId) {
      const member = group.members.find((m) => m.userId.toString() === userId);
      if (!member) return false;
      return member.role === 'owner' || member.role === 'admin';
}

router.post('/groups', authRequired, upload.single('avatar'), async (req, res, next) => {
      try {
            const { name, description, members = [] } = req.body;
            if (!name) return res.status(400).json({ message: 'name is required' });
            const ownerId = req.user.id;
            const avatarUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
            const uniqueMemberIds = Array.from(new Set([ownerId, ...[].concat(members)]));
            const group = await Group.create({
                  name,
                  description: description || '',
                  avatarUrl,
                  ownerId,
                  members: uniqueMemberIds.map((uid) => ({ userId: uid, role: uid === ownerId ? 'owner' : 'member' }))
            });
            res.status(201).json(group);
      } catch (err) { next(err); }
});

router.get('/groups/:groupId', authRequired, async (req, res, next) => {
      try {
            const { groupId } = req.params;
            const group = await Group.findById(groupId).lean();
            if (!group) return res.status(404).json({ message: 'Group not found' });
            const isMember = group.members.some((m) => m.userId.toString() === req.user.id);
            if (!isMember) return res.status(403).json({ message: 'Forbidden' });
            res.json(group);
      } catch (err) { next(err); }
});

router.put('/groups/:groupId', authRequired, upload.single('avatar'), async (req, res, next) => {
      try {
            const { groupId } = req.params;
            const { name, description, addMembers, removeMembers, promoteAdmins, demoteAdmins } = req.body;
            const group = await Group.findById(groupId);
            if (!group) return res.status(404).json({ message: 'Group not found' });
            if (!ensureAdminOrOwner(group, req.user.id)) return res.status(403).json({ message: 'Forbidden' });

            if (name) group.name = name;
            if (description !== undefined) group.description = description;
            if (req.file) group.avatarUrl = `/uploads/${req.file.filename}`;

            // Add members
            if (Array.isArray(addMembers) && addMembers.length) {
                  const existing = new Set(group.members.map((m) => m.userId.toString()));
                  addMembers.forEach((uid) => {
                        if (!existing.has(uid)) group.members.push({ userId: uid, role: 'member' });
                  });
            }
            // Remove members (cannot remove owner)
            if (Array.isArray(removeMembers) && removeMembers.length) {
                  group.members = group.members.filter((m) => m.role === 'owner' || !removeMembers.includes(m.userId.toString()));
            }
            // Promote to admin
            if (Array.isArray(promoteAdmins) && promoteAdmins.length) {
                  group.members.forEach((m) => {
                        if (promoteAdmins.includes(m.userId.toString()) && m.role === 'member') m.role = 'admin';
                  });
            }
            // Demote admin to member (cannot demote owner)
            if (Array.isArray(demoteAdmins) && demoteAdmins.length) {
                  group.members.forEach((m) => {
                        if (demoteAdmins.includes(m.userId.toString()) && m.role === 'admin') m.role = 'member';
                  });
            }

            await group.save();
            res.json(group);
      } catch (err) { next(err); }
});

// GET /users/:userId/groups — جلب مجموعات المستخدم
router.get('/users/:userId/groups', authRequired, async (req, res, next) => {
      try {
            const { userId } = req.params;
            if (userId !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
            const groups = await Group.find({ 'members.userId': userId }).sort({ updatedAt: -1 }).lean();
            res.json(groups);
      } catch (err) { next(err); }
});

// POST /groups/:groupId/messages — إرسال رسالة (Optional backup)
router.post('/groups/:groupId/messages', authRequired, upload.single('file'), async (req, res, next) => {
      try {
            const { groupId } = req.params;
            const { content, type = 'text' } = req.body;
            const group = await Group.findById(groupId);
            if (!group) return res.status(404).json({ message: 'Group not found' });
            const isMember = group.members.some((m) => m.userId.toString() === req.user.id);
            if (!isMember) return res.status(403).json({ message: 'Forbidden' });

            const mediaUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
            const msg = await GroupMessage.create({ groupId, senderId: req.user.id, type, content, mediaUrl });

            // Update group last activity and unread counts
            group.lastMessagePreview = type === 'text' ? content.slice(0, 100) : `[${type}]`;
            group.lastMessageAt = msg.createdAt;
            group.members.forEach((m) => {
                  const key = m.userId.toString();
                  if (key !== req.user.id) group.unreadCounts.set(key, (group.unreadCounts.get(key) || 0) + 1);
            });
            await group.save();

            // If socket.io available, broadcast to room
            try {
                  const io = req.app.get('io');
                  if (io) io.to(`group:${groupId}`).emit('group_message', { message: msg });
            } catch (_) { }

            res.status(201).json(msg);
      } catch (err) { next(err); }
});

// GET /groups/:groupId/messages — list messages (pagination)
router.get('/groups/:groupId/messages', authRequired, async (req, res, next) => {
      try {
            const { groupId } = req.params;
            const { before, limit = 50 } = req.query;
            const group = await Group.findById(groupId).select('members');
            if (!group) return res.status(404).json({ message: 'Group not found' });
            const isMember = group.members.some((m) => m.userId.toString() === req.user.id);
            if (!isMember) return res.status(403).json({ message: 'Forbidden' });

            const q = { groupId };
            if (before) q._id = { $lt: before };
            const msgs = await GroupMessage.find(q).sort({ _id: -1 }).limit(Math.min(Number(limit) || 50, 100));
            res.json(msgs.reverse());
      } catch (err) { next(err); }
});

module.exports = router;


