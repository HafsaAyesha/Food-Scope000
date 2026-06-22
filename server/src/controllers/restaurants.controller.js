const mongoose = require('mongoose');
const Bookmark = require('../models/bookmark.model');
const Restaurant = require('../models/restaurant.model');
const config = require('../config');
const { createApiError, handleError } = require('../utils/api-error');
const restaurantsService = require('../services/restaurants.service');
const { normalizePage, normalizeLimit, normalizeString } = require('../utils/helpers');

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatRestaurant = (restaurant) => ({
  id: restaurant._id,
  _id: restaurant._id,
  name: restaurant.name,
  description: restaurant.description,
  cuisine_type: restaurant.cuisine_type,
  price_range: restaurant.price_range,
  address: restaurant.address,
  lat: restaurant.lat,
  lng: restaurant.lng,
  location: restaurant.location,
  avg_rating: restaurant.avg_rating,
  tags: restaurant.tags || [],
  thumbnail: restaurant.thumbnail || '',
  owner_id: restaurant.owner_id,
  status: restaurant.status,
  created_at: restaurant.createdAt,
  updated_at: restaurant.updatedAt
});

const validateCoordinates = (lat, lng) => {
  if (lat === undefined || lng === undefined) return;
  const parsedLat = Number(lat);
  const parsedLng = Number(lng);
  if (Number.isNaN(parsedLat) || Number.isNaN(parsedLng) || parsedLat < -90 || parsedLat > 90 || parsedLng < -180 || parsedLng > 180) {
    throw createApiError(422, 'RESTAURANTS_INVALID_COORDINATES', 'VALIDATION_ERROR', 'Invalid latitude/longitude values.');
  }
};

// ── Controllers ───────────────────────────────────────────────────────────────

const getAllRestaurants = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const filters = { status: 'approved' };
    // allow clients to pass filters via query; normalization/validation should be moved to validation layer
    if (req.query.cuisine) filters.cuisine_type = req.query.cuisine;
    if (req.query.tag) filters.tags = String(req.query.tag).toLowerCase();
    if (req.query.price_range) filters.price_range = req.query.price_range;

    const { restaurants, total, page: currentPage } = await restaurantsService.listRestaurants({ filters, page: Number(page), limit: Number(limit) });

    res.json({ restaurants: restaurants.map((r) => ({ id: r._id, name: r.name, cuisine_type: r.cuisine_type, price_range: r.price_range, avg_rating: r.avg_rating, address: r.address, thumbnail: r.thumbnail })), total, page: currentPage });
  } catch (err) {
    handleError(res, err);
  }
};

const getSingleRestaurant = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) throw createApiError(404, 'RESTAURANTS_NOT_FOUND', 'NOT_FOUND_ERROR', 'Restaurant not found.');

    const restaurant = await Restaurant.findById(id);
    if (!restaurant || restaurant.status === 'deleted') throw createApiError(404, 'RESTAURANTS_NOT_FOUND', 'NOT_FOUND_ERROR', 'Restaurant not found.');

    const isAdmin = req.user?.role === 'admin';
    const isOwner = req.user && String(restaurant.owner_id) === String(req.user.id);
    if (restaurant.status === 'pending' && !isAdmin && !isOwner) {
      throw createApiError(404, 'RESTAURANTS_NOT_FOUND', 'NOT_FOUND_ERROR', 'Restaurant not found.');
    }

    res.json(formatRestaurant(restaurant));
  } catch (err) {
    handleError(res, err);
  }
};

const createNewRestaurant = async (req, res) => {
  try {
    const user = req.user;
    const body = { ...req.body };

    if (!body.location?.coordinates) {
      const lat = body.lat != null ? parseFloat(body.lat) : 0;
      const lng = body.lng != null ? parseFloat(body.lng) : 0;
      body.location = {
        type: 'Point',
        coordinates: [Number.isFinite(lng) ? lng : 0, Number.isFinite(lat) ? lat : 0]
      };
    }
    delete body.lat;
    delete body.lng;

    const restaurant = await restaurantsService.createRestaurant({ payload: body, user });
    res.status(201).json({ restaurant: formatRestaurant(restaurant) });
  } catch (err) {
    handleError(res, err);
  }
};

const updateExistingRestaurant = async (req, res) => {
  try {
    const restaurant = req.restaurant;
    const allowedFields = ['name', 'description', 'cuisine_type', 'address', 'location', 'price_range', 'thumbnail', 'tags'];
    const payload = req.body;
    const providedFields = Object.keys(payload);
    const invalidFields = providedFields.filter((f) => !allowedFields.includes(f));

    if (providedFields.length === 0 || invalidFields.length > 0) {
      throw createApiError(400, 'RESTAURANTS_INVALID_FIELDS', 'VALIDATION_ERROR', 'Invalid update fields.');
    }

    if (payload.price_range !== undefined && !['$', '$$', '$$$'].includes(payload.price_range)) {
      throw createApiError(400, 'RESTAURANTS_INVALID_PRICE_RANGE', 'VALIDATION_ERROR', 'Invalid price_range value.');
    }
    if (payload.tags !== undefined && !Array.isArray(payload.tags)) {
      throw createApiError(400, 'RESTAURANTS_INVALID_TAGS', 'VALIDATION_ERROR', 'tags must be an array.');
    }

    if (payload.name !== undefined) restaurant.name = String(payload.name).trim();
    if (payload.description !== undefined) restaurant.description = String(payload.description).trim();
    if (payload.cuisine_type !== undefined) restaurant.cuisine_type = String(payload.cuisine_type).trim();
    if (payload.address !== undefined) restaurant.address = String(payload.address).trim();
    if (payload.price_range !== undefined) restaurant.price_range = payload.price_range;
    if (payload.thumbnail !== undefined) restaurant.thumbnail = payload.thumbnail;
    if (payload.tags !== undefined) restaurant.tags = payload.tags;

    if (payload.location !== undefined) {
      const coords = payload.location?.coordinates;
      if (!Array.isArray(coords) || coords.length !== 2) {
        throw createApiError(422, 'RESTAURANTS_INVALID_COORDINATES', 'VALIDATION_ERROR', 'Invalid location coordinates.');
      }
      const lng = parseFloat(coords[0]);
      const lat = parseFloat(coords[1]);
      validateCoordinates(lat, lng);
      restaurant.location = { type: 'Point', coordinates: [lng, lat] };
    }

    await restaurant.save();
    res.json({ restaurant: formatRestaurant(restaurant) });
  } catch (err) {
    handleError(res, err);
  }
};

const removeRestaurant = async (req, res) => {
  try {
    const user = req.user;
    // Authorization already enforced by middleware (requireAdmin)
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) throw createApiError(404, 'RESTAURANTS_NOT_FOUND', 'NOT_FOUND_ERROR', 'Restaurant not found.');

    await restaurantsService.deleteRestaurant(req.params.id);
    try {
      const Review = mongoose.model('Review');
      await Review.updateMany({ restaurant_id: req.params.id }, { $set: { is_archived: true } });
    } catch {
      // optional
    }

    res.json({ message: 'Restaurant deleted successfully.' });
  } catch (err) {
    handleError(res, err);
  }
};

const bookmarkRestaurantById = async (req, res) => {
  try {
    const user = req.user;
    // Authorization already enforced by middleware (requireAuth)
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) throw createApiError(404, 'RESTAURANTS_NOT_FOUND', 'NOT_FOUND_ERROR', 'Restaurant not found.');

    const restaurant = await require('../models/restaurant.model').findById(req.params.id);
    if (!restaurant || restaurant.status !== 'approved') throw createApiError(404, 'RESTAURANTS_NOT_FOUND', 'NOT_FOUND_ERROR', 'Restaurant not found.');

    const existingBookmark = await Bookmark.findOne({ user_id: user.id, restaurant_id: restaurant._id });
    if (existingBookmark) throw createApiError(409, 'RESTAURANTS_ALREADY_BOOKMARKED', 'CONFLICT_ERROR', 'Already bookmarked.');

    const created = await Bookmark.create({
      user_id: user.id,
      restaurant_id: restaurant._id,
      restaurant_name: restaurant.name,
      restaurant_avg_rating: restaurant.avg_rating
    });

    res.status(201).json({ message: 'Bookmarked successfully.', bookmark_id: created._id });
  } catch (err) {
    handleError(res, err);
  }
};

module.exports = { getAllRestaurants, getSingleRestaurant, createNewRestaurant, updateExistingRestaurant, removeRestaurant, bookmarkRestaurantById };
