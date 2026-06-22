const mongoose = require('mongoose');
const { createApiError, handleError } = require('../utils/api-error');
const reviewsService = require('../services/reviews.service');
const { normalizePage, normalizeLimit } = require('../utils/helpers');

const recalculateRestaurantRating = async (restaurantId, session = null) => {
  const aggregate = await Review.aggregate([
    { $match: { restaurant_id: new mongoose.Types.ObjectId(restaurantId), status: 'active' } },
    { $group: { _id: '$restaurant_id', avgRating: { $avg: '$rating' } } }
  ]).session(session);

  const avgRating = aggregate.length ? Number(aggregate[0].avgRating.toFixed(2)) : 0;
  await Restaurant.findByIdAndUpdate(restaurantId, { avg_rating: avgRating }, { session, new: true });
};

const processPhotos = (photos) => {
  if (!photos) return [];
  if (!Array.isArray(photos)) throw createApiError(400, 'REVIEWS_INVALID_PHOTOS', 'VALIDATION_ERROR', 'photos must be an array.');
  if (photos.length > 5) throw createApiError(400, 'REVIEWS_TOO_MANY_PHOTOS', 'VALIDATION_ERROR', 'Maximum 5 photos allowed.');
  return photos.filter((p) => typeof p === 'string' && p.trim() !== '');
};

const createNewReview = async (req, res) => {
  try {
    const review = await reviewsService.createReview({ user: req.user, payload: req.body });
    res.status(201).json({ id: review._id, user_id: review.user_id, restaurant_id: review.restaurant_id, rating: review.rating, body: review.body, photos: review.photos, created_at: review.createdAt });
  } catch (err) {
    if (err && err.code === 11000) return handleError(res, createApiError(409, 'REVIEWS_DUPLICATE', 'CONFLICT_ERROR', 'One review per user per restaurant is allowed.'));
    handleError(res, err);
  }
};

const listReviews = async (req, res) => {
  try {
    const { restaurant_id, page, limit, sort } = req.query;
    const result = await reviewsService.listReviews({ restaurant_id, page: Number(page || 1), limit: Number(limit || 10), sort });
    const { reviews, total, summary, page: currentPage } = result;
    res.json({ reviews: reviews.map((review) => ({ id: review._id, rating: review.rating, body: review.body, photos: review.photos, helpful_count: review.helpful_count, not_helpful_count: review.not_helpful_count, created_at: review.createdAt, user: { id: review.user_id?._id || null, name: review.user_id?.name || '', avatar_url: review.user_id?.avatar_url || '' } })), avg_rating: Number((summary.avgRating || 0).toFixed(2)), total_reviews: summary.totalReviews || 0, total, page: currentPage });
  } catch (err) {
    handleError(res, err);
  }
};

const updateExistingReview = async (req, res) => {
  try {
    const review = req.review;
    const updated = await reviewsService.updateReview({ review, payload: req.body });
    res.json({ id: updated._id, rating: updated.rating, body: updated.body, updated_at: updated.updatedAt });
  } catch (err) {
    handleError(res, err);
  }
};

const removeReview = async (req, res) => {
  try {
    const review = req.review;
    await reviewsService.deleteReview({ review });
    res.json({ message: 'Review deleted.' });
  } catch (err) {
    handleError(res, err);
  }
};

const voteOnReview = async (req, res) => {
  try {
    const review = req.review;
    const userId = req.user.id;
    const { vote_type } = req.body;
    const result = await reviewsService.voteOnReview({ review, userId, vote_type });
    res.json({ message: 'Vote recorded.', helpful_count: result.helpful_count, not_helpful_count: result.not_helpful_count });
  } catch (err) {
    handleError(res, err);
  }
};

const flagReview = async (req, res) => {
  try {
    const Review = require('../models/review.model');
    const { reason } = req.body;

    if (!reason || typeof reason !== 'string' || reason.trim() === '') {
      throw createApiError(400, 'REVIEWS_FLAG_REASON_REQUIRED', 'VALIDATION_ERROR', 'reason is required.');
    }

    const review = await Review.findById(req.params.id);
    if (!review || review.status === 'archived') {
      throw createApiError(404, 'REVIEWS_NOT_FOUND', 'NOT_FOUND_ERROR', 'Review not found.');
    }

    const userId = String(req.user.id || req.user._id);
    const alreadyFlagged = review.flags.some((f) => f.flagged_by.toString() === userId);
    if (alreadyFlagged) {
      return res.status(409).json({ message: 'You have already flagged this review' });
    }

    review.flags.push({
      flagged_by: req.user.id || req.user._id,
      reason: reason.trim(),
      createdAt: new Date()
    });
    await review.save();

    res.status(201).json({
      message: 'Review flagged successfully.',
      review_id: review._id,
      flag_count: review.flags.length
    });
  } catch (err) {
    handleError(res, err);
  }
};

module.exports = { createNewReview, listReviews, updateExistingReview, removeReview, voteOnReview, flagReview };
