// Global error handling middleware
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error('Error:', err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = createError(message, 404);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    const message = `${field} '${value}' already exists`;
    error = createError(message, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    error = createError('Validation failed', 400, messages);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = createError('Invalid token', 401);
  }

  if (err.name === 'TokenExpiredError') {
    error = createError('Token expired', 401);
  }

  // Multer errors (file upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    error = createError('File too large', 400);
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    error = createError('Too many files', 400);
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    error = createError('Unexpected file field', 400);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Internal Server Error',
    errors: error.details || undefined,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });
};

// 404 Not Found middleware
const notFound = (req, res, next) => {
  const error = createError(`Not found - ${req.originalUrl}`, 404);
  next(error);
};

// Async error handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Create error object
const createError = (message, statusCode = 500, details = null) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  if (details) error.details = details;
  return error;
};

// Security error handler
const securityErrorHandler = (err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON in request body'
    });
  }

  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({
      success: false,
      message: 'Invalid CSRF token'
    });
  }

  next(err);
};

// Database connection error handler
const handleDatabaseError = (err, req, res, next) => {
  if (err.name === 'MongoNetworkError' || err.name === 'MongoTimeoutError') {
    console.error('Database connection error:', err);
    return res.status(503).json({
      success: false,
      message: 'Service temporarily unavailable. Please try again later.'
    });
  }

  next(err);
};

// Graceful shutdown handler
const gracefulShutdown = (server) => {
  return (signal) => {
    console.log(`\n${signal} received: Starting graceful shutdown...`);
    
    server.close(() => {
      console.log('✅ HTTP server closed');
      process.exit(0);
    });

    // Force close after 10 seconds
    setTimeout(() => {
      console.error('❌ Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  };
};

module.exports = {
  errorHandler,
  notFound,
  asyncHandler,
  createError,
  securityErrorHandler,
  handleDatabaseError,
  gracefulShutdown
};