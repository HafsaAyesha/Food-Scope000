const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');
const {
  me,
  updateMe,
  meBookmarks,
  meNotifications,
  meRestaurant,
  meRestaurantReviews,
  getMyProfile,
  updateMyProfile
} = require('../controllers/users.controller');

router.get('/me', authenticate, me);
router.put('/me', authenticate, updateMe);
router.get('/me/bookmarks', authenticate, meBookmarks);
router.get('/me/notifications', authenticate, meNotifications);
router.get('/me/restaurant/reviews', authenticate, requireRole('reviewer'), meRestaurantReviews);
router.get('/me/restaurant', authenticate, requireRole('reviewer'), meRestaurant);
router.get('/me/profile', authenticate, getMyProfile);
router.put('/me/profile', authenticate, updateMyProfile);

module.exports = router;
