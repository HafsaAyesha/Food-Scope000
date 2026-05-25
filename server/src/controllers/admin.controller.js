const mongoose = require('mongoose');
const User = require('../models/auth.model');
const Restaurant = require('../models/restaurant.model');
const Review = require('../models/review.model');
const { addNotification } = require('./users.controller');
const { createApiError, handleError } = require('../utils/api-error');
const auditService = require('../services/audit.service');
const { normalizePage, normalizeLimit, calculateSkip } = require('../utils/helpers');

// ── Controllers ───────────────────────────────────────────────────────────────

const getUsers = async (req, res) => {
  try {
    const { role, status } = req.query;
    const page = normalizePage(req.query.page);
    const limit = normalizeLimit(req.query.limit);
    const skip = calculateSkip(page, limit);

    const filter = {};
    if (role) filter.role = role;
    if (status) {
      if (!['active', 'suspended'].includes(status)) throw createApiError(400, 'ADMIN_INVALID_STATUS_FILTER', 'VALIDATION_ERROR', 'status must be active or suspended.');
      filter.isSuspended = status === 'suspended';
    }

    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).select('name email role isSuspended review_count'),
      User.countDocuments(filter)
    ]);

    res.json({
      users: users.map((u) => ({
        id: u._id, name: u.name, email: u.email, role: u.role,
        status: u.isSuspended ? 'suspended' : 'active', review_count: u.review_count || 0
      })),
      total
    });
  } catch (err) {
    handleError(res, err);
  }
};

const patchRestaurantStatus = async (req, res) => {
  try {
    const { status, reason } = req.body;

    if (!status) throw createApiError(400, 'ADMIN_STATUS_REQUIRED', 'VALIDATION_ERROR', 'status is required.');
    if (!['approved', 'rejected', 'suspended'].includes(status)) throw createApiError(400, 'ADMIN_INVALID_RESTAURANT_STATUS', 'VALIDATION_ERROR', 'Invalid restaurant status.');
    if (['rejected', 'suspended'].includes(status) && (!reason || String(reason).trim() === '')) throw createApiError(400, 'ADMIN_REASON_REQUIRED', 'VALIDATION_ERROR', 'reason is required for this status.');
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) throw createApiError(404, 'RESTAURANTS_NOT_FOUND', 'NOT_FOUND_ERROR', 'Restaurant not found.');

    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant || restaurant.status === 'deleted') throw createApiError(404, 'RESTAURANTS_NOT_FOUND', 'NOT_FOUND_ERROR', 'Restaurant not found.');

    restaurant.status = status;
    await restaurant.save();

    // Audit admin action
    try {
      await auditService.logAuditEvent({
        actorId: req.user ? req.user.id : null,
        actionType: 'restaurant_status_change',
        targetEntity: 'restaurant',
        targetId: restaurant._id,
        metadata: { status, reason }
      });
    } catch (err) {
      console.warn('Failed to write audit log:', err.message);
    }

    try {
      const message = ['rejected', 'suspended'].includes(status)
        ? `Your restaurant "${restaurant.name}" has been ${status}. Reason: ${String(reason).trim()}`
        : `Your restaurant "${restaurant.name}" has been approved.`;
      await addNotification(restaurant.owner_id, { type: 'restaurant_status', message });
    } catch (err) {
      console.warn(`Failed to notify restaurant owner ${restaurant.owner_id}: ${err.message}`);
    }

    res.json({ id: restaurant._id, status: restaurant.status, updated_at: restaurant.updatedAt });
  } catch (err) {
    handleError(res, err);
  }
};

const patchReviewModeration = async (req, res) => {
  try {
    const { action, reason } = req.body;

    if (!action) throw createApiError(400, 'ADMIN_ACTION_REQUIRED', 'VALIDATION_ERROR', 'action is required.');
    if (!['hide', 'restore'].includes(action)) throw createApiError(400, 'ADMIN_INVALID_ACTION', 'VALIDATION_ERROR', 'action must be hide or restore.');
    if (action === 'hide' && (!reason || String(reason).trim() === '')) throw createApiError(400, 'ADMIN_REASON_REQUIRED', 'VALIDATION_ERROR', 'reason is required when hiding a review.');
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) throw createApiError(404, 'REVIEWS_NOT_FOUND', 'NOT_FOUND_ERROR', 'Review not found.');

    const review = await Review.findById(req.params.id);
    if (!review) throw createApiError(404, 'REVIEWS_NOT_FOUND', 'NOT_FOUND_ERROR', 'Review not found.');

    review.status = action === 'hide' ? 'hidden' : 'active';
    await review.save();

    try {
      await auditService.logAuditEvent({
        actorId: req.user ? req.user.id : null,
        actionType: 'review_moderation',
        targetEntity: 'review',
        targetId: review._id,
        metadata: { action, reason }
      });
    } catch (err) {
      console.warn('Failed to write audit log:', err.message);
    }

    res.json({ id: review._id, status: review.status, updated_at: review.updatedAt });
  } catch (err) {
    handleError(res, err);
  }
};

const getPlatformAnalytics = async (req, res) => {
  try {
    const [totalUsers, totalRestaurants, totalReviews, pendingRestaurants, topRatedRestaurants, mostActiveReviewers] = await Promise.all([
      User.countDocuments({}),
      Restaurant.countDocuments({ status: { $ne: 'deleted' } }),
      Review.countDocuments({ status: { $ne: 'archived' } }),
      Restaurant.countDocuments({ status: 'pending' }),
      Restaurant.find({ status: 'approved' }).sort({ avg_rating: -1 }).limit(5).select('name avg_rating cuisine_type price_range'),
      User.find({ role: 'reviewer' }).sort({ review_count: -1 }).limit(10).select('name email review_count role')
    ]);

    res.json({
      total_users: totalUsers,
      total_restaurants: totalRestaurants,
      total_reviews: totalReviews,
      pending_restaurants: pendingRestaurants,
      top_rated_restaurants: topRatedRestaurants.map((r) => ({ id: r._id, name: r.name, avg_rating: r.avg_rating, cuisine_type: r.cuisine_type, price_range: r.price_range })),
      most_active_reviewers: mostActiveReviewers.map((u) => ({ id: u._id, name: u.name, email: u.email, role: u.role, review_count: u.review_count || 0 }))
    });
  } catch (err) {
    handleError(res, err);
  }
};

module.exports = { getUsers, patchRestaurantStatus, patchReviewModeration, getPlatformAnalytics };
