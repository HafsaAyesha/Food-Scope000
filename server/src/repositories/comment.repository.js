const Comment = require('../models/comment.model');
const BaseRepository = require('./base.repository');

class CommentRepository extends BaseRepository {
  constructor() {
    super(Comment);
  }

  /**
   * Find comments on a review
   */
  async findByReview(reviewId, options = {}) {
    const filters = { review_id: reviewId, status: 'active' };
    return this.paginate(filters, { ...options, sort: { createdAt: -1 } });
  }

  /**
   * Find comments by user
   */
  async findByUser(userId, options = {}) {
    const filters = { user_id: userId };
    return this.paginate(filters, { ...options, sort: { createdAt: -1 } });
  }

  /**
   * Get comment count for a review
   */
  async getCommentCount(reviewId) {
    return this.count({ review_id: reviewId, status: 'active' });
  }

  /**
   * Check if user has already commented on review
   */
  async hasCommentedOnReview(userId, reviewId) {
    const comment = await this.findOne({
      user_id: userId,
      review_id: reviewId,
      status: 'active'
    });
    return !!comment;
  }

  /**
   * Approve a comment (admin action)
   */
  async approve(commentId) {
    return this.updateById(commentId, { status: 'active' });
  }

  /**
   * Reject a comment (admin action)
   */
  async reject(commentId, reason = null) {
    return this.updateById(commentId, { status: 'rejected', rejectionReason: reason });
  }

  /**
   * Archive a comment (soft delete)
   */
  async archive(commentId) {
    return this.updateById(commentId, { status: 'deleted' });
  }
}

module.exports = new CommentRepository();
