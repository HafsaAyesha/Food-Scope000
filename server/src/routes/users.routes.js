const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth.middleware');
const {
  me,
  updateMe,
  meBookmarks,
  meNotifications
} = require('../controllers/users.controller');

router.get('/me', authenticate, me);
router.put('/me', authenticate, updateMe);
router.get('/me/bookmarks', authenticate, meBookmarks);
router.get('/me/notifications', authenticate, meNotifications);

module.exports = router;
