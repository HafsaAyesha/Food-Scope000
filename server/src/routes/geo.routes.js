const express = require('express');
const router = express.Router();
const { createApiError } = require('../utils/api-error');
const { validate } = require('../middlewares/validate.middleware');
const { nearby, resolve, reverse, ipLocation } = require('../controllers/geo.controller');

const validateCoordinatesQuery = (req) => {
  const { lat, lng } = req.query;
  if (lat === undefined || lng === undefined) {
    throw createApiError(400, 'GEO_MISSING_PARAMS', 'VALIDATION_ERROR', 'lat and lng are required.');
  }
};

const validateNearbyQuery = (req) => {
  const { radius } = req.query;
  validateCoordinatesQuery(req);

  const parsedRadius = radius === undefined ? 5 : Number(radius);
  if (Number.isNaN(parsedRadius) || parsedRadius <= 0) {
    throw createApiError(400, 'GEO_INVALID_RADIUS', 'VALIDATION_ERROR', 'radius must be a positive number.');
  }
};

const validateResolveQuery = (req) => {
  const { query } = req.query;
  if (!query || String(query).trim().length < 2) {
    throw createApiError(400, 'GEO_RESOLVE_QUERY_INVALID', 'VALIDATION_ERROR', 'query is required and must be at least 2 characters.');
  }
};

router.get('/nearby', validate(validateNearbyQuery), nearby);
router.get('/resolve', validate(validateResolveQuery), resolve);
router.get('/reverse', validate(validateCoordinatesQuery), reverse);
router.get('/location/ip', ipLocation);

module.exports = router;
