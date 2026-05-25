const User = require('../models/auth.model');
const BaseRepository = require('./base.repository');

class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  /**
   * Find users by role
   */
  async findByRole(role, options = {}) {
    const filters = { role };
    return this.paginate(filters, options);
  }

  /**
   * Find active users (not suspended, not deleted)
   */
  async findActive(options = {}) {
    const filters = { isSuspended: false, isDeleted: false };
    return this.paginate(filters, options);
  }

  /**
   * Find suspended users
   */
  async findSuspended(options = {}) {
    const filters = { isSuspended: true };
    return this.paginate(filters, options);
  }

  /**
   * Find user by email
   */
  async findByEmail(email) {
    return this.findOne({ email });
  }

  /**
   * Suspend a user
   */
  async suspend(userId, reason = null) {
    return this.updateById(userId, { isSuspended: true, suspensionReason: reason });
  }

  /**
   * Unsuspend a user
   */
  async unsuspend(userId) {
    return this.updateById(userId, { isSuspended: false, suspensionReason: null });
  }

  /**
   * Soft delete a user
   */
  async softDelete(userId) {
    return this.updateById(userId, { isDeleted: true });
  }

  /**
   * Increment review count
   */
  async incrementReviewCount(userId) {
    return this.model.findByIdAndUpdate(
      userId,
      { $inc: { review_count: 1 } },
      { new: true }
    );
  }

  /**
   * Decrement review count
   */
  async decrementReviewCount(userId) {
    return this.model.findByIdAndUpdate(
      userId,
      { $inc: { review_count: -1 } },
      { new: true }
    );
  }
}

module.exports = new UserRepository();
