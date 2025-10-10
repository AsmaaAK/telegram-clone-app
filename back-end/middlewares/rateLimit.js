const rateLimit = require('express-rate-limit');
const cacheService = require('../services/cacheService');

// Custom store for rate limiting using Redis
const createRedisStore = () => ({
  increment: async (key) => {
    const result = await cacheService.checkRateLimit(key, 1, 60); // Using existing rate limit function
    return {
      totalHits: result.remaining,
      resetTime: new Date(Date.now() + result.reset * 1000)
    };
  }
});

// General rate limiter
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Strict rate limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Message rate limiter
const messageLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // Limit each user to 30 messages per minute
  keyGenerator: (req) => req.userId?.toString() || req.ip,
  message: {
    success: false,
    message: 'Too many messages sent, please slow down.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// File upload rate limiter
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each user to 10 uploads per hour
  keyGenerator: (req) => req.userId?.toString() || req.ip,
  message: {
    success: false,
    message: 'Too many file uploads, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Search rate limiter
const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // Limit each user to 20 searches per minute
  keyGenerator: (req) => req.userId?.toString() || req.ip,
  message: {
    success: false,
    message: 'Too many search requests, please slow down.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Group creation limiter
const groupCreationLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 5, // Limit each user to 5 groups per day
  keyGenerator: (req) => req.userId?.toString(),
  message: {
    success: false,
    message: 'Group creation limit reached. You can create up to 5 groups per day.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Dynamic rate limiter based on user role
const createRoleBasedLimiter = (defaultLimit, adminLimit = 1000) => {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: (req) => {
      return req.user?.role === 'admin' ? adminLimit : defaultLimit;
    },
    keyGenerator: (req) => req.userId?.toString() || req.ip,
    message: {
      success: false,
      message: 'Too many requests, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false
  });
};

// API key rate limiter (for future use)
const apiKeyLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // Limit each API key to 100 requests per minute
  keyGenerator: (req) => {
    return req.headers['x-api-key'] || req.ip;
  },
  message: {
    success: false,
    message: 'API rate limit exceeded.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  generalLimiter,
  authLimiter,
  messageLimiter,
  uploadLimiter,
  searchLimiter,
  groupCreationLimiter,
  createRoleBasedLimiter,
  apiKeyLimiter
};