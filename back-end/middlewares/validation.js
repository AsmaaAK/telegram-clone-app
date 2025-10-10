const { body, param, query, validationResult } = require('express-validator');
const User = require('../models/User');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errorMessages
    });
  }

  next();
};

// User registration validation
const validateRegistration = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be between 3 and 20 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores')
    .custom(async (username) => {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        throw new Error('Username already exists');
      }
      return true;
    }),

  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail()
    .custom(async (email) => {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new Error('Email already exists');
      }
      return true;
    }),

  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),

  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .escape(),

  handleValidationErrors
];

// User login validation
const validateLogin = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username or email is required'),

  body('password')
    .notEmpty()
    .withMessage('Password is required'),

  handleValidationErrors
];

// Conversation validation
const validateConversation = [
  body('participantId')
    .isMongoId()
    .withMessage('Valid participant ID is required')
    .custom(async (participantId, { req }) => {
      if (participantId === req.user._id.toString()) {
        throw new Error('Cannot create conversation with yourself');
      }
      
      const participant = await User.findById(participantId);
      if (!participant) {
        throw new Error('Participant not found');
      }
      return true;
    }),

  handleValidationErrors
];

// Message validation
const validateMessage = [
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Message content is required')
    .isLength({ max: 5000 })
    .withMessage('Message cannot exceed 5000 characters')
    .escape(),

  body('type')
    .optional()
    .isIn(['text', 'image', 'file', 'system'])
    .withMessage('Invalid message type'),

  body('replyTo')
    .optional()
    .isMongoId()
    .withMessage('Invalid reply message ID'),

  handleValidationErrors
];

// Group creation validation
const validateGroupCreation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Group name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Group name must be between 2 and 50 characters')
    .escape(),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters')
    .escape(),

  body('members')
    .optional()
    .isArray()
    .withMessage('Members must be an array')
    .custom((members) => {
      if (members && members.some(member => !member.match(/^[0-9a-fA-F]{24}$/))) {
        throw new Error('Invalid member ID format');
      }
      return true;
    }),

  body('settings.isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean'),

  body('settings.allowInvites')
    .optional()
    .isBoolean()
    .withMessage('allowInvites must be a boolean'),

  body('settings.approvalRequired')
    .optional()
    .isBoolean()
    .withMessage('approvalRequired must be a boolean'),

  handleValidationErrors
];

// User update validation
const validateUserUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .escape(),

  body('about')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('About cannot exceed 500 characters')
    .escape(),

  body('settings.theme')
    .optional()
    .isIn(['light', 'dark'])
    .withMessage('Theme must be either light or dark'),

  body('settings.language')
    .optional()
    .isLength({ min: 2, max: 10 })
    .withMessage('Language must be between 2 and 10 characters'),

  body('settings.showLastSeen')
    .optional()
    .isBoolean()
    .withMessage('showLastSeen must be a boolean'),

  body('settings.hideStatus')
    .optional()
    .isBoolean()
    .withMessage('hideStatus must be a boolean'),

  handleValidationErrors
];

// File upload validation
const validateFileUpload = [
  body('type')
    .optional()
    .isIn(['image', 'file'])
    .withMessage('Type must be either image or file'),

  handleValidationErrors
];

// Pagination validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),

  query('search')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Search term must be between 2 and 50 characters')
    .escape(),

  handleValidationErrors
];

// Object ID validation for params
const validateObjectId = (paramName) => [
  param(paramName)
    .isMongoId()
    .withMessage(`Invalid ${paramName} format`),
  
  handleValidationErrors
];

// Search validation
const validateSearch = [
  query('q')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Search query must be between 2 and 50 characters')
    .escape(),

  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateRegistration,
  validateLogin,
  validateConversation,
  validateMessage,
  validateGroupCreation,
  validateUserUpdate,
  validateFileUpload,
  validatePagination,
  validateObjectId,
  validateSearch
};