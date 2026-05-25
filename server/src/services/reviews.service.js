const mongoose = require('mongoose');
const Review = require('../models/review.model');
const ReviewVote = require('../models/review-vote.model');
const Restaurant = require('../models/restaurant.model');
const Dish = require('../models/dish.model');
const { createApiError } = require('../utils/api-error');
const { runTransaction } = require('./db.service');

const normalizePage = (page) => {
  const parsed = Number(page);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
};

const normalizeLimit = (limit) => {
  const parsed = Number(limit);
  if (!Number.isInteger(parsed) || parsed <= 0) return 10;
  return Math.min(parsed, 100);
};

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

const createReview = async ({ user, payload }) => {
  const { restaurant_id, dish_id, rating, body, photos } = payload;

  if (!restaurant_id) throw createApiError(400, 'REVIEWS_RESTAURANT_REQUIRED', 'VALIDATION_ERROR', 'restaurant_id is required.');
  if (!mongoose.Types.ObjectId.isValid(restaurant_id)) throw createApiError(404, 'RESTAURANTS_NOT_FOUND', 'NOT_FOUND_ERROR', 'Restaurant not found.');

  const restaurant = await Restaurant.findById(restaurant_id);
  if (!restaurant || restaurant.status === 'deleted') throw createApiError(404, 'RESTAURANTS_NOT_FOUND', 'NOT_FOUND_ERROR', 'Restaurant not found.');

  const numericRating = Number(rating);
  if (Number.isNaN(numericRating) || numericRating < 1 || numericRating > 5) throw createApiError(422, 'REVIEWS_INVALID_RATING', 'VALIDATION_ERROR', 'Rating must be between 1 and 5.');

  if (dish_id !== undefined && dish_id !== null) {
    if (!mongoose.Types.ObjectId.isValid(dish_id)) throw createApiError(404, 'DISHES_NOT_FOUND', 'NOT_FOUND_ERROR', 'Dish not found.');
    const dish = await Dish.findOne({ _id: dish_id, restaurant_id });
    if (!dish) throw createApiError(404, 'DISHES_NOT_FOUND', 'NOT_FOUND_ERROR', 'Dish not found.');
  }

  const photoList = processPhotos(photos);

  const review = await runTransaction(async (session) => {
    const [created] = await Review.create([
      {
        user_id: user.id,
        restaurant_id,
        dish_id: dish_id || null,
        rating: numericRating,
        body: body || '',
        photos: photoList
      }
    ], { session });

    await recalculateRestaurantRating(restaurant_id, session);
    return created;
  });

  return review;
};

const listReviews = async ({ restaurant_id, page, limit, sort }) => {
  if (!restaurant_id) throw createApiError(400, 'REVIEWS_RESTAURANT_REQUIRED', 'VALIDATION_ERROR', 'restaurant_id query parameter is required.');
  if (!mongoose.Types.ObjectId.isValid(restaurant_id)) throw createApiError(404, 'RESTAURANTS_NOT_FOUND', 'NOT_FOUND_ERROR', 'Restaurant not found.');

  const restaurant = await Restaurant.findById(restaurant_id);
  if (!restaurant || restaurant.status === 'deleted') throw createApiError(404, 'RESTAURANTS_NOT_FOUND', 'NOT_FOUND_ERROR', 'Restaurant not found.');

  const currentPage = normalizePage(page);
  const currentLimit = normalizeLimit(limit);
  const skip = (currentPage - 1) * currentLimit;

  let sortQuery = { helpful_count: -1, createdAt: -1 };
  if (sort === 'newest') sortQuery = { createdAt: -1 };
  if (sort === 'highest_rated') sortQuery = { rating: -1, createdAt: -1 };

  const [reviews, total, ratingAgg] = await Promise.all([
    Review.find({ restaurant_id, status: 'active' }).sort(sortQuery).skip(skip).limit(currentLimit).populate('user_id', 'name avatar_url'),
    Review.countDocuments({ restaurant_id, status: 'active' }),
    Review.aggregate([
      { $match: { restaurant_id: new mongoose.Types.ObjectId(restaurant_id), status: 'active' } },
      { $group: { _id: '$restaurant_id', avgRating: { $avg: '$rating' }, totalReviews: { $sum: 1 } } }
    ])
  ]);

  const summary = ratingAgg[0] || { avgRating: 0, totalReviews: 0 };

  return { reviews, total, summary, page: currentPage };
};

const updateReview = async ({ review, payload }) => {
  const providedFields = Object.keys(payload);
  const allowedFields = ['rating', 'body'];
  const invalidFields = providedFields.filter((f) => !allowedFields.includes(f));
  if (providedFields.length === 0 || invalidFields.length > 0) throw createApiError(400, 'REVIEWS_INVALID_FIELDS', 'VALIDATION_ERROR', 'Invalid fields.');

  let ratingChanged = false;
  let bodyChanged = false;

  if (payload.rating !== undefined) {
    const numericRating = Number(payload.rating);
    if (Number.isNaN(numericRating) || numericRating < 1 || numericRating > 5) throw createApiError(422, 'REVIEWS_INVALID_RATING', 'VALIDATION_ERROR', 'Rating must be between 1 and 5.');
    review.rating = numericRating;
    ratingChanged = true;
  }
  if (payload.body !== undefined) {
    review.body = payload.body;
    bodyChanged = true;
  }

  await runTransaction(async (session) => {
    await review.save({ session });
    if (ratingChanged) await recalculateRestaurantRating(review.restaurant_id, session);
  });

  if (bodyChanged) console.warn(`Moderation hook triggered for review ${review._id}`);
  return review;
};

const deleteReview = async ({ review }) => {
  await runTransaction(async (session) => {
    review.status = 'archived';
    review.archived_at = new Date();
    await review.save({ session });
    await recalculateRestaurantRating(review.restaurant_id, session);
  });
  return;
};

const voteOnReview = async ({ review, userId, vote_type }) => {
  if (!['helpful', 'not_helpful'].includes(vote_type)) throw createApiError(400, 'REVIEWS_INVALID_VOTE', 'VALIDATION_ERROR', 'vote_type must be helpful or not_helpful.');

  const result = await runTransaction(async (session) => {
    const existingVote = await ReviewVote.findOne({ review_id: review._id, user_id: userId }).session(session);
    const update = { helpful_count: 0, not_helpful_count: 0 };

    if (existingVote) {
      if (existingVote.vote_type === vote_type) throw createApiError(409, 'REVIEWS_DUPLICATE_VOTE', 'CONFLICT_ERROR', 'Duplicate vote not allowed.');
      if (existingVote.vote_type === 'helpful') update.helpful_count -= 1;
      if (existingVote.vote_type === 'not_helpful') update.not_helpful_count -= 1;
      existingVote.vote_type = vote_type;
      await existingVote.save({ session });
    } else {
      await ReviewVote.create([{
        review_id: review._id,
        user_id: userId,
        vote_type
      }], { session });
    }

    if (vote_type === 'helpful') update.helpful_count += 1;
    if (vote_type === 'not_helpful') update.not_helpful_count += 1;

    const updatedReview = await Review.findByIdAndUpdate(
      review._id,
      {
        $inc: update,
        $set: { updatedAt: new Date() }
      },
      { new: true, session }
    );

    return { helpful_count: updatedReview.helpful_count, not_helpful_count: updatedReview.not_helpful_count };
  });

  return result;
};

module.exports = { createReview, listReviews, updateReview, deleteReview, voteOnReview };
