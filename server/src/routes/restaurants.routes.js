const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth.middleware');
const { requireReviewerOrAdmin, requireAuth, requireAdmin } = require('../middlewares/authorization.middleware');
const {
  getAllRestaurants,
  getSingleRestaurant,
  createNewRestaurant,
  updateExistingRestaurant,
  removeRestaurant,
  bookmarkRestaurantById
} = require('../controllers/restaurants.controller');
const dishesRoutes = require('./dishes.routes');

router.get('/', getAllRestaurants);
router.get('/:id', getSingleRestaurant);
router.post('/', authenticate, requireReviewerOrAdmin, createNewRestaurant);
router.put('/:id', authenticate, requireAuth, updateExistingRestaurant);
router.delete('/:id', authenticate, requireAdmin, removeRestaurant);
router.post('/:id/bookmark', authenticate, requireAuth, bookmarkRestaurantById);
router.use('/:id/dishes', dishesRoutes);

module.exports = router;
