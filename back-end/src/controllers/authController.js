const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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

class AuthController {
      // Get upload middleware
      static getUploadMiddleware() {
            return upload;
      }

      // Register new user
      static async register(req, res) {
            try {
                  const { username, password, name } = req.body;

                  // Validation
                  if (!username || !password) {
                        return res.status(400).json({
                              message: 'Username and password are required',
                              code: 'VALIDATION_ERROR'
                        });
                  }

                  if (password.length < 6) {
                        return res.status(400).json({
                              message: 'Password must be at least 6 characters long',
                              code: 'VALIDATION_ERROR'
                        });
                  }

                  // Check if user already exists
                  const existingUser = await User.findOne({
                        username: username.toLowerCase()
                  });

                  if (existingUser) {
                        return res.status(409).json({
                              message: 'Username taken',
                              code: 'USERNAME_TAKEN'
                        });
                  }

                  // Hash password
                  const passwordHash = await bcrypt.hash(password, 10);

                  // Prepare user data
                  const userData = {
                        username: username.toLowerCase(),
                        passwordHash,
                        name: name || username
                  };

                  // Handle avatar upload if present
                  if (req.file) {
                        userData.avatarUrl = `/uploads/${req.file.filename}`;
                  }

                  // Create user
                  const user = await User.create(userData);

                  // Generate JWT token
                  const token = jwt.sign(
                        { sub: user._id.toString() },
                        process.env.JWT_SECRET || 'dev_secret',
                        { expiresIn: '7d' }
                  );

                  console.log('[Auth] Created user', { id: user._id.toString(), username: user.username });

                  res.status(201).json({
                        token,
                        user: {
                              id: user._id,
                              name: user.name,
                              username: user.username
                        }
                  });
            } catch (error) {
                  console.error('Registration error:', error);
                  res.status(500).json({ message: 'Server error', code: 'SERVER_ERROR' });
            }
      }

      // Login user
      static async login(req, res) {
            try {
                  const { username, password } = req.body;

                  // Validation
                  if (!username || !password) {
                        return res.status(400).json({
                              message: 'Username and password are required',
                              code: 'VALIDATION_ERROR'
                        });
                  }

                  // Find user
                  const user = await User.findOne({ username: username.toLowerCase() });
                  if (!user) {
                        return res.status(401).json({
                              message: 'Invalid credentials',
                              code: 'INVALID_CREDENTIALS'
                        });
                  }

                  // Check password
                  const isValidPassword = await bcrypt.compare(password, user.passwordHash);
                  if (!isValidPassword) {
                        return res.status(401).json({
                              message: 'Invalid credentials',
                              code: 'INVALID_CREDENTIALS'
                        });
                  }

                  // Generate JWT token
                  const token = jwt.sign(
                        { sub: user._id.toString() },
                        process.env.JWT_SECRET || 'dev_secret',
                        { expiresIn: '7d' }
                  );

                  res.json({
                        token,
                        user: {
                              id: user._id,
                              name: user.name,
                              username: user.username
                        }
                  });
            } catch (error) {
                  console.error('Login error:', error);
                  res.status(500).json({ message: 'Server error', code: 'SERVER_ERROR' });
            }
      }

      // Get current user profile
      static async getProfile(req, res) {
            try {
                  const userId = req.user.id;
                  const user = await User.findById(userId).select('-password');

                  if (!user) {
                        return res.status(404).json({
                              message: 'User not found',
                              code: 'USER_NOT_FOUND'
                        });
                  }

                  res.json({ user });
            } catch (error) {
                  console.error('Get profile error:', error);
                  res.status(500).json({ message: 'Server error', code: 'SERVER_ERROR' });
            }
      }

      // Update user profile
      static async updateProfile(req, res) {
            try {
                  const userId = req.user.id;
                  const { name, username, email } = req.body;

                  const user = await User.findById(userId);
                  if (!user) {
                        return res.status(404).json({
                              message: 'User not found',
                              code: 'USER_NOT_FOUND'
                        });
                  }

                  // Check if username is already taken by another user
                  if (username && username !== user.username) {
                        const existingUser = await User.findOne({
                              username,
                              _id: { $ne: userId }
                        });
                        if (existingUser) {
                              return res.status(400).json({
                                    message: 'Username already taken',
                                    code: 'USERNAME_TAKEN'
                              });
                        }
                        user.username = username;
                  }

                  // Check if email is already taken by another user
                  if (email && email !== user.email) {
                        const existingUser = await User.findOne({
                              email,
                              _id: { $ne: userId }
                        });
                        if (existingUser) {
                              return res.status(400).json({
                                    message: 'Email already taken',
                                    code: 'EMAIL_TAKEN'
                              });
                        }
                        user.email = email;
                  }

                  if (name) {
                        user.name = name;
                  }

                  // Handle avatar upload if present
                  if (req.file) {
                        user.avatarUrl = `/uploads/${req.file.filename}`;
                  }

                  await user.save();

                  // Remove password from response
                  const userResponse = user.toObject();
                  delete userResponse.password;

                  res.json({
                        message: 'Profile updated successfully',
                        user: userResponse
                  });
            } catch (error) {
                  console.error('Update profile error:', error);
                  res.status(500).json({ message: 'Server error', code: 'SERVER_ERROR' });
            }
      }

      // Change password
      static async changePassword(req, res) {
            try {
                  const userId = req.user.id;
                  const { currentPassword, newPassword } = req.body;

                  // Validation
                  if (!currentPassword || !newPassword) {
                        return res.status(400).json({
                              message: 'Current password and new password are required',
                              code: 'VALIDATION_ERROR'
                        });
                  }

                  if (newPassword.length < 6) {
                        return res.status(400).json({
                              message: 'New password must be at least 6 characters long',
                              code: 'VALIDATION_ERROR'
                        });
                  }

                  const user = await User.findById(userId);
                  if (!user) {
                        return res.status(404).json({
                              message: 'User not found',
                              code: 'USER_NOT_FOUND'
                        });
                  }

                  // Verify current password
                  const isValidPassword = await bcrypt.compare(currentPassword, user.password);
                  if (!isValidPassword) {
                        return res.status(401).json({
                              message: 'Current password is incorrect',
                              code: 'INVALID_CURRENT_PASSWORD'
                        });
                  }

                  // Hash new password
                  const hashedPassword = await bcrypt.hash(newPassword, 12);
                  user.password = hashedPassword;
                  await user.save();

                  res.json({ message: 'Password changed successfully' });
            } catch (error) {
                  console.error('Change password error:', error);
                  res.status(500).json({ message: 'Server error', code: 'SERVER_ERROR' });
            }
      }
}

module.exports = AuthController;
