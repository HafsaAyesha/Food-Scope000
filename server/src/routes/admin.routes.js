const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');

const {
  getUsers,
  patchRestaurantStatus,
  patchReviewModeration,
  getPlatformAnalytics
} = require('../controllers/admin.controller');

router.use(authenticate, requireRole('admin'));

router.get('/users', getUsers);
router.patch('/restaurants/:id/status', patchRestaurantStatus);
router.patch('/reviews/:id/moderate', patchReviewModeration);
router.get('/analytics', getPlatformAnalytics);

module.exports = router;
