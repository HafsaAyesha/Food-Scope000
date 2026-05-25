const express = require('express');
const router = express.Router();
const Restaurant = require('../models/restaurant.model');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');
const { loadResource, requireOwnership } = require('../middlewares/ownership.middleware');

const {
  listTags,
  createNewTag,
  addTagToRestaurant
} = require('../controllers/tags.controller');

router.get('/tags', listTags);
router.post('/tags', authenticate, requireRole('reviewer', 'admin'), createNewTag);

router.post(
  '/restaurants/:id/tags',
  authenticate,
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
  addTagToRestaurant
);

module.exports = router;
