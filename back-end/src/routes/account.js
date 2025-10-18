const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const { authRequired } = require('../middlewares/auth');

const router = express.Router();

router.post(
      '/password',
      authRequired,
      [body('currentPassword').isString(), body('newPassword').isString().isLength({ min: 6 })],
      async (req, res, next) => {
            try {
                  const errors = validationResult(req);
                  if (!errors.isEmpty()) return res.status(400).json({ message: 'Validation error', code: 'VALIDATION_ERROR', errors: errors.array() });
                  const user = await User.findById(req.user.id);
                  const ok = await bcrypt.compare(req.body.currentPassword, user.passwordHash);
                  if (!ok) return res.status(400).json({ message: 'Current password incorrect', code: 'BAD_PASSWORD' });
                  user.passwordHash = await bcrypt.hash(req.body.newPassword, 10);
                  await user.save();
                  res.json({ message: 'Password updated' });
            } catch (e) {
                  next(e);
            }
      }
);

router.post('/settings', authRequired, async (req, res, next) => {
      try {
            const allowed = ['language', 'theme', 'showLastSeen', 'hideStatus'];
            const updates = {};
            for (const key of allowed) if (key in req.body) updates[`settings.${key}`] = req.body[key];
            const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).select('-passwordHash');
            res.json(user.settings);
      } catch (e) {
            next(e);
      }
});

module.exports = router;


