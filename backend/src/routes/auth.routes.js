const router = require('express').Router();
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validator');
const { authLimiter } = require('../middleware/rateLimiter');

const loginRules = [
  body('email').isEmail().normalizeEmail().withMessage('Email noto\'g\'ri'),
  body('password').notEmpty().withMessage('Parol kiritilmagan'),
];

const passwordRules = [
  body('currentPassword').notEmpty().withMessage('Joriy parol kiritilmagan'),
  body('newPassword').isLength({ min: 8 }).withMessage('Yangi parol kamida 8 belgi'),
];

router.post('/login', authLimiter, loginRules, validate, authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.me);
router.put('/change-password', authenticate, passwordRules, validate, authController.changePassword);

module.exports = router;
