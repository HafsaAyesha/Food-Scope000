const mongoose = require('mongoose');
const Bookmark = require('../models/bookmark.model');
const config = require('../config');
const { createApiError, handleError } = require('../utils/api-error');
const restaurantsService = require('../services/restaurants.service');
const { normalizePage, normalizeLimit, normalizeString } = require('../utils/helpers');

// ── Helpers ───────────────────────────────────────────────────────────────────

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
    const requesterRole = req.user ? req.user.role : null;
    const restaurant = await restaurantsService.getRestaurant(id, requesterRole);
    res.json({ id: restaurant._id, name: restaurant.name, description: restaurant.description, cuisine_type: restaurant.cuisine_type, price_range: restaurant.price_range, address: restaurant.address, lat: restaurant.lat, lng: restaurant.lng, avg_rating: restaurant.avg_rating, tags: restaurant.tags || [], thumbnail: restaurant.thumbnail || '', owner_id: restaurant.owner_id, dishes: [], recent_reviews: [] });
  } catch (err) {
    handleError(res, err);
  }
};

const createNewRestaurant = async (req, res) => {
  try {
    const user = req.user;
    // Authorization already enforced by middleware (requireReviewerOrAdmin)

    const restaurant = await restaurantsService.createRestaurant({ payload: req.body, user });
    res.status(201).json({ id: restaurant._id, name: restaurant.name, status: restaurant.status, created_at: restaurant.createdAt });
  } catch (err) {
    handleError(res, err);
  }
};

const updateExistingRestaurant = async (req, res) => {
  try {
    const user = req.user;
    // Authorization already enforced by middleware (requireAuth)
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) throw createApiError(404, 'RESTAURANTS_NOT_FOUND', 'NOT_FOUND_ERROR', 'Restaurant not found.');

    // Authorization checks remain in middleware; service will enforce business rules
    const updated = await restaurantsService.updateRestaurant(req.params.id, req.body);
    res.json({ id: updated._id, name: updated.name, updated_at: updated.updatedAt });
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
