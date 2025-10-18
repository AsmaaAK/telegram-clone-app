const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const User = require('../models/User');

// Configure multer for avatar uploads
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
            cb(null, 'avatar_' + uniqueSuffix + path.extname(file.originalname));
      }
});

const upload = multer({
      storage,
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
      fileFilter: (req, file, cb) => {
            const allowedTypes = /jpeg|jpg|png|gif/;
            const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
            const mimetype = allowedTypes.test(file.mimetype);

            if (mimetype && extname) {
                  return cb(null, true);
            } else {
                  cb(new Error('Only image files are allowed for avatar'));
            }
      }
});

class UsersController {
      // Get upload middleware
      static getUploadMiddleware() {
            return upload;
      }

      // Get all users (for contacts)
      static async getAllUsers(req, res, next) {
            try {
                  const q = (req.query.q || '').toString().trim();
                  // Exclude current user from contacts list
                  const filter = { _id: { $ne: req.user.id } };
                  if (q) {
                        filter.$or = [
                              { name: new RegExp(q, 'i') },
                              { username: new RegExp(q, 'i') }
                        ];
                  }
                  const users = await User.find(filter).select('name username avatarUrl status lastSeen');
                  res.json(users);
            } catch (e) {
                  next(e);
            }
      }

      // Get user by ID
      static async getUserById(req, res, next) {
            try {
                  const user = await User.findById(req.params.id).select('-passwordHash');
                  if (!user) return res.status(404).json({ message: 'User not found', code: 'NOT_FOUND' });
                  res.json(user);
            } catch (e) {
                  next(e);
            }
      }

      // Update current user profile
      static async updateProfile(req, res, next) {
            try {
                  const errors = validationResult(req);
                  if (!errors.isEmpty()) return res.status(400).json({ message: 'Validation error', code: 'VALIDATION_ERROR', errors: errors.array() });

                  const updates = { name: req.body.name, about: req.body.about };
                  const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).select('-passwordHash');
                  res.json(user);
            } catch (e) {
                  next(e);
            }
      }

      // Upload avatar
      static async uploadAvatar(req, res, next) {
            try {
                  if (!req.file) {
                        return res.status(400).json({ message: 'No file uploaded', code: 'NO_FILE' });
                  }

                  // Optimize image using Sharp
                  const inputPath = req.file.path;
                  const outputPath = inputPath.replace(path.extname(inputPath), '-opt' + path.extname(inputPath));

                  await sharp(inputPath)
                        .resize(200, 200, { fit: 'cover' })
                        .jpeg({ quality: 80 })
                        .toFile(outputPath);

                  // Delete original file
                  fs.unlinkSync(inputPath);

                  // Update user avatar URL
                  const user = await User.findByIdAndUpdate(
                        req.user.id,
                        { avatarUrl: `/uploads/${path.basename(outputPath)}` },
                        { new: true }
                  ).select('-passwordHash');

                  res.json({ message: 'Avatar uploaded successfully', user });
            } catch (e) {
                  next(e);
            }
      }

      // Block user
      static async blockUser(req, res, next) {
            try {
                  const { userId } = req.body;
                  if (!userId) return res.status(400).json({ message: 'User ID is required', code: 'VALIDATION_ERROR' });

                  const user = await User.findByIdAndUpdate(
                        req.user.id,
                        { $addToSet: { blockedUsers: userId } },
                        { new: true }
                  ).select('-passwordHash');

                  res.json({ message: 'User blocked successfully', user });
            } catch (e) {
                  next(e);
            }
      }

      // Unblock user
      static async unblockUser(req, res, next) {
            try {
                  const { userId } = req.body;
                  if (!userId) return res.status(400).json({ message: 'User ID is required', code: 'VALIDATION_ERROR' });

                  const user = await User.findByIdAndUpdate(
                        req.user.id,
                        { $pull: { blockedUsers: userId } },
                        { new: true }
                  ).select('-passwordHash');

                  res.json({ message: 'User unblocked successfully', user });
            } catch (e) {
                  next(e);
            }
      }

      // Get blocked users
      static async getBlockedUsers(req, res, next) {
            try {
                  const user = await User.findById(req.user.id)
                        .select('blockedUsers')
                        .populate('blockedUsers', 'name username avatarUrl');

                  res.json({ blockedUsers: user.blockedUsers || [] });
            } catch (e) {
                  next(e);
            }
      }

      // Search users
      static async searchUsers(req, res, next) {
            try {
                  const { q } = req.query;
                  if (!q || q.trim().length < 2) {
                        return res.status(400).json({ message: 'Search query must be at least 2 characters', code: 'VALIDATION_ERROR' });
                  }

                  const users = await User.find({
                        _id: { $ne: req.user.id },
                        $or: [
                              { name: new RegExp(q.trim(), 'i') },
                              { username: new RegExp(q.trim(), 'i') }
                        ]
                  }).select('name username avatarUrl status lastSeen').limit(20);

                  res.json(users);
            } catch (e) {
                  next(e);
            }
      }

      // Get user presence
      static async getUserPresence(req, res, next) {
            try {
                  const { userId } = req.params;
                  const user = await User.findById(userId).select('status lastSeen');

                  if (!user) {
                        return res.status(404).json({ message: 'User not found', code: 'NOT_FOUND' });
                  }

                  res.json({
                        status: user.status,
                        lastSeen: user.lastSeen
                  });
            } catch (e) {
                  next(e);
            }
      }
}

module.exports = UsersController;

