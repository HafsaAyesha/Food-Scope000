const Review = require('../models/review.model');
const BaseRepository = require('./base.repository');

class ReviewRepository extends BaseRepository {
  constructor() {
    super(Review);
  }

  /**
   * Find reviews by restaurant
   */
  async findByRestaurant(restaurantId, options = {}) {
    const filters = { restaurant_id: restaurantId, status: 'active' };
    return this.paginate(filters, { ...options, sort: { createdAt: -1 } });
  }

  /**
   * Find reviews by user
   */
  async findByUser(userId, options = {}) {
    const filters = { user_id: userId };
    return this.paginate(filters, { ...options, sort: { createdAt: -1 } });
  }

  /**
   * Find reviews pending moderation
   */
  async findPending(options = {}) {
    const filters = { status: 'pending' };
    return this.paginate(filters, options);
  }

  /**
   * Check if user has already reviewed restaurant
   */
  async hasReviewedRestaurant(userId, restaurantId) {
    const review = await this.findOne({
      user_id: userId,
      restaurant_id: restaurantId,
      status: 'active'
    });
    return !!review;
  }

  /**
   * Get average rating for restaurant
   */
  async getAverageRating(restaurantId) {
    const result = await this.aggregate([
      {
        $match: {
          restaurant_id: require('mongoose').Types.ObjectId(restaurantId),
          status: 'active'
        }
      },
      {
        $group: {
          _id: '$restaurant_id',
          avgRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 }
        }
      }
    ]);

    if (result.length === 0) {
      return { avgRating: 0, totalReviews: 0 };
    }

    return {
      avgRating: Number(result[0].avgRating.toFixed(2)),
      totalReviews: result[0].totalReviews
    };
  }

  /**
   * Get rating distribution for restaurant
   */
  async getRatingDistribution(restaurantId) {
    const result = await this.aggregate([
      {
        $match: {
          restaurant_id: require('mongoose').Types.ObjectId(restaurantId),
          status: 'active'
        }
      },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    return result;
  }

  /**
   * Approve a review (admin action)
   */
  async approve(reviewId) {
    return this.updateById(reviewId, { status: 'active' });
  }

  /**
   * Reject a review (admin action)
   */
  async reject(reviewId, reason = null) {
    return this.updateById(reviewId, { status: 'rejected', rejectionReason: reason });
  }

  /**
   * Archive a review (soft delete)
   */
  async archive(reviewId) {
    return this.updateById(reviewId, { is_archived: true });
  }
}

module.exports = new ReviewRepository();
