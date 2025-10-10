// Export all middlewares from a single file
const { authenticate, optionalAuth, authorizeAdmin, authorize, checkOwnership } = require('./auth');
const {
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
} = require('./validation');

const {
  upload,
  uploadAvatar,
  uploadFile,
  uploadMultiple,
  handleUploadError
} = require('./upload');

const {
  generalLimiter,
  authLimiter,
  messageLimiter,
  uploadLimiter,
  searchLimiter,
  groupCreationLimiter,
  createRoleBasedLimiter,
  apiKeyLimiter
} = require('./rateLimit');

const {
  errorHandler,
  notFound,
  asyncHandler,
  createError,
  securityErrorHandler,
  handleDatabaseError,
  gracefulShutdown
} = require('./error');

const {
  corsOptions,
  securityHeaders,
  xssProtection,
  requestLogger,
  sanitizeInput,
  apiKeyAuth,
  validateContentType,
  validateSizeLimit
} = require('./security');

module.exports = {
  // Authentication
  authenticate,
  optionalAuth,
  authorizeAdmin,
  authorize,
  checkOwnership,

  // Validation
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
  validateSearch,

  // File Upload
  upload,
  uploadAvatar,
  uploadFile,
  uploadMultiple,
  handleUploadError,

  // Rate Limiting
  generalLimiter,
  authLimiter,
  messageLimiter,
  uploadLimiter,
  searchLimiter,
  groupCreationLimiter,
  createRoleBasedLimiter,
  apiKeyLimiter,

  // Error Handling
  errorHandler,
  notFound,
  asyncHandler,
  createError,
  securityErrorHandler,
  handleDatabaseError,
  gracefulShutdown,

  // Security
  corsOptions,
  securityHeaders,
  xssProtection,
  requestLogger,
  sanitizeInput,
  apiKeyAuth,
  validateContentType,
  validateSizeLimit
};