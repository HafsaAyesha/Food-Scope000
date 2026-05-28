const express = require('express');
const router = express.Router();

const { authenticate } = require('../middlewares/auth.middleware');

const {
  register,
  login,
  logout,
  refresh,
  forgotPassword,
  resetUserPassword,
  getMe,
  verifyEmail,
  resendVerification
} = require('../controllers/auth.controller');

// public routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetUserPassword);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);

router.get('/me', authenticate, getMe);
router.post('/logout', authenticate, logout);

module.exports = router;
