const express = require('express');
const router = express.Router();
const { authRequired } = require('../middlewares/auth');
const AuthController = require('../controllers/authController');

// Register new user
router.post('/register',
      AuthController.getUploadMiddleware().single('avatar'),
      AuthController.register
);

// Login user
router.post('/login', AuthController.login);

// Get current user profile
router.get('/profile', authRequired, AuthController.getProfile);

// Update user profile
router.put('/profile',
      authRequired,
      AuthController.getUploadMiddleware().single('avatar'),
      AuthController.updateProfile
);

// Change password
router.put('/password', authRequired, AuthController.changePassword);

module.exports = router;