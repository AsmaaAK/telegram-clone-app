const User = require('../models/User');
const Conversation = require('../models/Conversation');
const bcrypt = require('bcryptjs');
const { cloudinary } = require('../config/cloudinary');

// Get all users (with pagination and search)
exports.getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const skip = (page - 1) * limit;

    // Build search query
    const searchQuery = search ? {
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    } : {};

    // Exclude current user and blocked users
    const currentUser = await User.findById(req.user.userId);
    const blockedUsers = currentUser.blockedUsers || [];

    const query = {
      ...searchQuery,
      _id: { 
        $ne: req.user.userId,
        $nin: blockedUsers
      }
    };

    const users = await User.find(query)
      .select('-password -__v')
      .sort({ name: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Search users
exports.searchUsers = async (req, res) => {
  try {
    const { q: searchTerm } = req.query;

    if (!searchTerm || searchTerm.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search term must be at least 2 characters long'
      });
    }

    const currentUser = await User.findById(req.user.userId);
    const blockedUsers = currentUser.blockedUsers || [];

    const users = await User.find({
      $and: [
        {
          $or: [
            { name: { $regex: searchTerm, $options: 'i' } },
            { username: { $regex: searchTerm, $options: 'i' } }
          ]
        },
        {
          _id: { 
            $ne: req.user.userId,
            $nin: blockedUsers
          }
        }
      ]
    })
    .select('_id name username avatar status lastSeen')
    .limit(20);

    res.json({
      success: true,
      users
    });

  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select('-password -__v');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, about, settings } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (about !== undefined) updateData.about = about;
    if (settings) updateData.settings = { ...settings };

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password -__v');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Upload avatar
exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'telegram-clone/avatars',
      width: 200,
      height: 200,
      crop: 'fill',
      quality: 'auto',
      format: 'webp'
    });

    // Delete old avatar from Cloudinary if exists
    const user = await User.findById(req.user.userId);
    if (user.avatar) {
      const publicId = user.avatar.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`telegram-clone/avatars/${publicId}`);
    }

    // Update user with new avatar
    user.avatar = result.secure_url;
    await user.save();

    res.json({
      success: true,
      message: 'Avatar uploaded successfully',
      avatarUrl: result.secure_url
    });

  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during avatar upload'
    });
  }
};

// Block user
exports.blockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.userId;

    if (userId === currentUserId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot block yourself'
      });
    }

    const userToBlock = await User.findById(userId);
    if (!userToBlock) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const currentUser = await User.findById(currentUserId);
    
    // Check if already blocked
    if (currentUser.blockedUsers.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: 'User is already blocked'
      });
    }

    // Add to blocked users
    currentUser.blockedUsers.push(userId);
    await currentUser.save();

    // Find and update any existing conversation
    await Conversation.findOneAndUpdate(
      {
        type: 'private',
        participants: { $all: [currentUserId, userId] }
      },
      { 
        isBlocked: true,
        blockedBy: currentUserId
      }
    );

    res.json({
      success: true,
      message: 'User blocked successfully'
    });

  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Unblock user
exports.unblockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.userId;

    const currentUser = await User.findById(currentUserId);
    
    // Check if user is blocked
    if (!currentUser.blockedUsers.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: 'User is not blocked'
      });
    }

    // Remove from blocked users
    currentUser.blockedUsers = currentUser.blockedUsers.filter(
      id => id.toString() !== userId
    );
    await currentUser.save();

    // Find and update conversation
    await Conversation.findOneAndUpdate(
      {
        type: 'private',
        participants: { $all: [currentUserId, userId] }
      },
      { 
        isBlocked: false,
        blockedBy: null
      }
    );

    res.json({
      success: true,
      message: 'User unblocked successfully'
    });

  } catch (error) {
    console.error('Unblock user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update user settings
exports.updateSettings = async (req, res) => {
  try {
    const { theme, language, showLastSeen, hideStatus } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      {
        $set: {
          'settings.theme': theme,
          'settings.language': language,
          'settings.showLastSeen': showLastSeen,
          'settings.hideStatus': hideStatus
        }
      },
      { new: true, runValidators: true }
    ).select('-password -__v');

    res.json({
      success: true,
      message: 'Settings updated successfully',
      settings: user.settings
    });

  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};