const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const Restaurant = require('../models/restaurant.model');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireReviewerOrAdmin, requireAuth, requireAdmin } = require('../middlewares/authorization.middleware');
const { requireRole } = require('../middlewares/role.middleware');
const { loadResource, requireOwnership } = require('../middlewares/ownership.middleware');
const {
  getAllRestaurants,
  getSingleRestaurant,
  createNewRestaurant,
  updateExistingRestaurant,
  removeRestaurant,
  bookmarkRestaurantById
} = require('../controllers/restaurants.controller');
const dishesRoutes = require('./dishes.routes');

const optionalAuthenticate = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return next();
  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = { id: decoded.sub || decoded.id, role: decoded.role };
  } catch {
    // Public GET — ignore invalid tokens
  }
  return next();
};

router.get('/', getAllRestaurants);
router.get('/:id', optionalAuthenticate, getSingleRestaurant);
router.post('/', authenticate, requireReviewerOrAdmin, createNewRestaurant);
router.put(
  '/:id',
  authenticate,
  requireRole('reviewer', 'admin'),
  loadResource({
    model: Restaurant,
    paramId: 'id',
    attachAs: 'restaurant',
    notFoundCode: 'RESTAURANTS_NOT_FOUND',
    notFoundMessage: 'Restaurant not found.',
    additionalQuery: { status: { $ne: 'deleted' } }
  }),
  requireOwnership({
    resourceKey: 'restaurant',
    ownerField: 'owner_id',
    forbiddenCode: 'RESTAURANTS_FORBIDDEN',
    forbiddenMessage: 'Not the owner or admin.'
  }),
  updateExistingRestaurant
);
router.delete('/:id', authenticate, requireAdmin, removeRestaurant);
router.post('/:id/bookmark', authenticate, requireAuth, bookmarkRestaurantById);
router.use('/:id/dishes', dishesRoutes);

module.exports = router;
