const express = require('express');
const { body, validationResult } = require('express-validator');
const { authRequired } = require('../middlewares/auth');
const UsersController = require('../controllers/usersController');

const router = express.Router();

// Get all users (for contacts)
router.get('/', authRequired, UsersController.getAllUsers);

// Get user by ID
router.get('/:id', authRequired, UsersController.getUserById);

// Update current user profile
router.put('/me',
      authRequired,
      [body('name').optional().isString(), body('about').optional().isString()],
      UsersController.updateProfile
);

// Upload avatar
router.post('/me/avatar',
      authRequired,
      UsersController.getUploadMiddleware().single('avatar'),
      UsersController.uploadAvatar
);

// Block user
router.post('/block', authRequired, UsersController.blockUser);

// Unblock user
router.post('/unblock', authRequired, UsersController.unblockUser);

// Get blocked users
router.get('/me/blocked', authRequired, UsersController.getBlockedUsers);

// Search users
router.get('/search', authRequired, UsersController.searchUsers);

// Get user presence
router.get('/:userId/presence', authRequired, UsersController.getUserPresence);

module.exports = router;