const rateLimit = require('express-rate-limit');
const config = require('../config/config');

const globalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Juda ko\'p so\'rov. Keyinroq urinib ko\'ring.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Juda ko\'p noto\'g\'ri urinish. 15 daqiqadan so\'ng urinib ko\'ring.' },
});

module.exports = { globalLimiter, authLimiter };
