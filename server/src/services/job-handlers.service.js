/**
 * Job Handlers for Background Tasks
 * Register handlers for different job types
 */

const jobQueue = require('./job-queue.service');
const { logger } = require('./logger.service');
const mailService = require('./mail.service');

/**
 * Email job handler
 */
const handleEmailJob = async (data) => {
  const { to, subject, template, context } = data;

  if (!to || !subject) {
    throw new Error('Email job requires to and subject');
  }

  try {
    await mailService.sendMail({ to, subject, template, context });
    logger.info({ to, subject }, 'Email sent successfully');
  } catch (err) {
    logger.error({ to, err: err.message }, 'Failed to send email');
    throw err;
  }
};

/**
 * Notification job handler
 */
const handleNotificationJob = async (data) => {
  const { userId, type, message } = data;

  if (!userId || !type || !message) {
    throw new Error('Notification job requires userId, type, and message');
  }

  try {
    const Notification = require('../models/notification.model');
    await Notification.create({
      user_id: userId,
      type,
      message,
      read: false
    });
    logger.info({ userId, type }, 'Notification created');
  } catch (err) {
    logger.error({ userId, err: err.message }, 'Failed to create notification');
    throw err;
  }
};

/**
 * Update restaurant rating job handler
 */
const handleUpdateRatingJob = async (data) => {
  const { restaurantId } = data;

  if (!restaurantId) {
    throw new Error('Update rating job requires restaurantId');
  }

  try {
    const Review = require('../models/review.model');
    const Restaurant = require('../models/restaurant.model');
    const mongoose = require('mongoose');

    const result = await Review.aggregate([
      {
        $match: {
          restaurant_id: new mongoose.Types.ObjectId(restaurantId),
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

    if (result.length > 0) {
      const { avgRating, totalReviews } = result[0];
      await Restaurant.findByIdAndUpdate(restaurantId, {
        avg_rating: Number(avgRating.toFixed(2)),
        review_count: totalReviews
      });
      logger.info({ restaurantId, avgRating, totalReviews }, 'Restaurant rating updated');
    }
  } catch (err) {
    logger.error({ restaurantId, err: err.message }, 'Failed to update restaurant rating');
    throw err;
  }
};

/**
 * Audit log job handler
 */
const handleAuditLogJob = async (data) => {
  const { actorId, actionType, targetEntity, targetId, metadata } = data;

  try {
    const AuditLog = require('../models/audit-log.model');
    await AuditLog.create({
      actor_id: actorId,
      action_type: actionType,
      target_entity: targetEntity,
      target_id: targetId,
      metadata: metadata || {}
    });
    logger.info({ actionType, targetEntity }, 'Audit log created');
  } catch (err) {
    logger.error({ err: err.message }, 'Failed to create audit log');
    throw err;
  }
};

/**
 * Data cleanup job handler
 */
const handleCleanupJob = async (data) => {
  const { type } = data;

  try {
    if (type === 'expired_tokens') {
      const UserToken = require('../models/user-token.model');
      const result = await UserToken.deleteMany({
        expiresAt: { $lt: new Date() }
      });
      logger.info({ deletedCount: result.deletedCount }, 'Expired tokens cleaned up');
    } else if (type === 'orphaned_reviews') {
      const Review = require('../models/review.model');
      const Restaurant = require('../models/restaurant.model');
      const restaurantIds = await Restaurant.distinct('_id');
      const result = await Review.deleteMany({
        restaurant_id: { $nin: restaurantIds }
      });
      logger.info({ deletedCount: result.deletedCount }, 'Orphaned reviews cleaned up');
    }
  } catch (err) {
    logger.error({ type, err: err.message }, 'Cleanup job failed');
    throw err;
  }
};

/**
 * Register all job handlers
 */
const registerJobHandlers = () => {
  jobQueue.registerHandler('send_email', handleEmailJob);
  jobQueue.registerHandler('create_notification', handleNotificationJob);
  jobQueue.registerHandler('update_restaurant_rating', handleUpdateRatingJob);
  jobQueue.registerHandler('audit_log', handleAuditLogJob);
  jobQueue.registerHandler('cleanup', handleCleanupJob);

  logger.info('All job handlers registered');
};

module.exports = {
  registerJobHandlers,
  handleEmailJob,
  handleNotificationJob,
  handleUpdateRatingJob,
  handleAuditLogJob,
  handleCleanupJob
};
