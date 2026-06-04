const User = require('../models/auth.model');
const Bookmark = require('../models/bookmark.model');
const Notification = require('../models/notification.model');
const Restaurant = require('../models/restaurant.model');
const Review = require('../models/review.model');
const Profile = require('../models/profile.model');
const { createApiError, handleError } = require('../utils/api-error');

const normalizePage = (page) => {
  const parsed = Number(page);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
};

const normalizeLimit = (limit) => {
  const parsed = Number(limit);
  if (!Number.isInteger(parsed) || parsed <= 0) return 10;
  return Math.min(parsed, 100);
};

const addNotification = async (userId, { type, message, metadata = {} }) => {
  if (!type || !message) throw createApiError(400, 'NOTIFICATIONS_INVALID', 'VALIDATION_ERROR', 'type and message are required.');
  const user = await User.findById(userId);
  if (!user) throw createApiError(404, 'USERS_NOT_FOUND', 'NOT_FOUND_ERROR', 'User not found.');

  await Notification.create({
    user_id: user._id,
    type: String(type).trim(),
    message: String(message).trim(),
    metadata
  });

  return true;
};

const me = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) throw createApiError(401, 'AUTH_UNAUTHORIZED', 'AUTH_ERROR', 'Unauthorized.');

    const bookmarkCount = await Bookmark.countDocuments({ user_id: user._id });

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar_url: user.avatar_url || '',
      review_count: user.review_count || 0,
      bookmark_count: bookmarkCount,
      created_at: user.createdAt
    });
  } catch (err) {
    handleError(res, err);
  }
};

const updateMe = async (req, res) => {
  try {
    const { name, avatar_url } = req.body;
    if (name === undefined && avatar_url === undefined) throw createApiError(400, 'USERS_INVALID_FIELDS', 'VALIDATION_ERROR', 'Provide at least one valid field.');
    if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) throw createApiError(400, 'USERS_INVALID_NAME', 'VALIDATION_ERROR', 'Name must be a non-empty string.');
    if (avatar_url !== undefined && typeof avatar_url !== 'string') throw createApiError(400, 'USERS_INVALID_AVATAR', 'VALIDATION_ERROR', 'avatar_url must be a string.');

    const user = await User.findById(req.user.id);
    if (!user) throw createApiError(401, 'AUTH_UNAUTHORIZED', 'AUTH_ERROR', 'Unauthorized.');

    if (name !== undefined) user.name = name.trim();
    if (avatar_url !== undefined) user.avatar_url = avatar_url.trim();
    await user.save();

    res.json({ id: user._id, name: user.name, avatar_url: user.avatar_url || '' });
  } catch (err) {
    handleError(res, err);
  }
};

const meBookmarks = async (req, res) => {
  try {
    const page = normalizePage(req.query.page);
    const limit = normalizeLimit(req.query.limit);
    const skip = (page - 1) * limit;

    const [bookmarks, total] = await Promise.all([
      Bookmark.find({ user_id: req.user.id }).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Bookmark.countDocuments({ user_id: req.user.id })
    ]);

    res.json({
      bookmarks: bookmarks.map((bookmark) => ({
        restaurant_id: bookmark.restaurant_id,
        name: bookmark.restaurant_name,
        avg_rating: bookmark.restaurant_avg_rating,
        saved_at: bookmark.createdAt
      })),
      total,
      page
    });
  } catch (err) {
    handleError(res, err);
  }
};

const meNotifications = async (req, res) => {
  try {
    const onlyUnread = String(req.query.unread_only).toLowerCase() === 'true';
    const filter = { user_id: req.user.id };
    if (onlyUnread) filter.is_read = false;

    const notifications = await Notification.find(filter).sort({ createdAt: -1 }).limit(100);

    res.json({
      notifications: notifications.map((notification) => ({
        id: notification._id,
        type: notification.type,
        message: notification.message,
        is_read: notification.is_read,
        created_at: notification.createdAt,
        metadata: notification.metadata || {}
      }))
    });
  } catch (err) {
    handleError(res, err);
  }
};

const meRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({
      owner_id: req.user.id,
      status: { $ne: 'deleted' }
    });

    if (!restaurant) {
      throw createApiError(404, 'RESTAURANTS_NOT_FOUND', 'NOT_FOUND_ERROR', 'You do not have a restaurant yet.');
    }

    const totalReviews = await Review.countDocuments({
      restaurant_id: restaurant._id,
      status: 'active'
    });

    res.json({
      id: restaurant._id,
      name: restaurant.name,
      description: restaurant.description,
      cuisine_type: restaurant.cuisine_type,
      price_range: restaurant.price_range,
      avg_rating: restaurant.avg_rating,
      status: restaurant.status,
      thumbnail: restaurant.thumbnail || '',
      total_reviews: totalReviews,
      created_at: restaurant.createdAt,
      updated_at: restaurant.updatedAt
    });
  } catch (err) {
    handleError(res, err);
  }
};

const meRestaurantReviews = async (req, res) => {
  try {
    const page = normalizePage(req.query.page);
    const limit = normalizeLimit(req.query.limit);
    const skip = (page - 1) * limit;

    const restaurant = await Restaurant.findOne({
      owner_id: req.user.id,
      status: { $ne: 'deleted' }
    });

    if (!restaurant) {
      throw createApiError(404, 'RESTAURANTS_NOT_FOUND', 'NOT_FOUND_ERROR', 'You do not have a restaurant yet.');
    }

    const filter = { restaurant_id: restaurant._id, status: 'active' };

    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .populate('user_id', 'name avatar_url')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Review.countDocuments(filter)
    ]);

    const avgAggregate = await Review.aggregate([
      { $match: filter },
      { $group: { _id: '$restaurant_id', avgRating: { $avg: '$rating' } } }
    ]);
    const avgRating = avgAggregate.length ? Number(avgAggregate[0].avgRating.toFixed(2)) : 0;

    res.json({
      reviews: reviews.map((review) => ({
        id: review._id,
        rating: review.rating,
        body: review.body,
        photos: review.photos,
        helpful_count: review.helpful_count,
        not_helpful_count: review.not_helpful_count,
        created_at: review.createdAt,
        user: {
          id: review.user_id?._id || null,
          name: review.user_id?.name || '',
          avatar_url: review.user_id?.avatar_url || ''
        }
      })),
      avg_rating: avgRating,
      total_reviews: total,
      total,
      page
    });
  } catch (err) {
    handleError(res, err);
  }
};

const formatProfileResponse = (profile) => {
  if (!profile) return null;
  if (profile.role === 'reviewer') {
    return {
      user_id: profile.user_id,
      role: profile.role,
      business_description: profile.business_description || '',
      contact: profile.contact || '',
      restaurant_id: profile.restaurant_id || null,
      created_at: profile.createdAt,
      updated_at: profile.updatedAt
    };
  }
  return {
    user_id: profile.user_id,
    role: profile.role,
    bio: profile.bio || '',
    favorite_cuisines: profile.favorite_cuisines || [],
    review_count: profile.review_count || 0,
    created_at: profile.createdAt,
    updated_at: profile.updatedAt
  };
};

const getMyProfile = async (req, res) => {
  try {
    const profile = await Profile.findOne({ user_id: req.user.id });
    res.json({ profile: formatProfileResponse(profile) });
  } catch (err) {
    handleError(res, err);
  }
};

const updateMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) throw createApiError(401, 'AUTH_UNAUTHORIZED', 'AUTH_ERROR', 'Unauthorized.');

    if (user.role === 'admin') {
      throw createApiError(400, 'PROFILE_NOT_SUPPORTED', 'VALIDATION_ERROR', 'Admin accounts do not use extended profiles.');
    }

    const profileRole = user.role === 'reviewer' ? 'reviewer' : 'user';
    let profile = await Profile.findOne({ user_id: user._id });

    if (profileRole === 'reviewer') {
      const { business_description, contact } = req.body;
      if (business_description === undefined && contact === undefined) {
        throw createApiError(400, 'PROFILE_INVALID_FIELDS', 'VALIDATION_ERROR', 'Provide at least one valid field.');
      }
      if (business_description !== undefined && typeof business_description !== 'string') {
        throw createApiError(400, 'PROFILE_INVALID_DESCRIPTION', 'VALIDATION_ERROR', 'business_description must be a string.');
      }
      if (contact !== undefined && typeof contact !== 'string') {
        throw createApiError(400, 'PROFILE_INVALID_CONTACT', 'VALIDATION_ERROR', 'contact must be a string.');
      }

      const restaurant = await Restaurant.findOne({
        owner_id: user._id,
        status: { $ne: 'deleted' }
      });

      if (!profile) {
        profile = new Profile({
          user_id: user._id,
          role: 'reviewer',
          restaurant_id: restaurant?._id || null
        });
      }

      if (business_description !== undefined) profile.business_description = business_description.trim();
      if (contact !== undefined) profile.contact = contact.trim();
      if (restaurant) profile.restaurant_id = restaurant._id;
      await profile.save();
    } else {
      const { bio, favorite_cuisines } = req.body;
      if (bio === undefined && favorite_cuisines === undefined) {
        throw createApiError(400, 'PROFILE_INVALID_FIELDS', 'VALIDATION_ERROR', 'Provide at least one valid field.');
      }
      if (bio !== undefined && typeof bio !== 'string') {
        throw createApiError(400, 'PROFILE_INVALID_BIO', 'VALIDATION_ERROR', 'bio must be a string.');
      }
      if (favorite_cuisines !== undefined && !Array.isArray(favorite_cuisines)) {
        throw createApiError(400, 'PROFILE_INVALID_CUISINES', 'VALIDATION_ERROR', 'favorite_cuisines must be an array.');
      }

      if (!profile) {
        profile = new Profile({
          user_id: user._id,
          role: 'user',
          review_count: user.review_count || 0
        });
      }

      if (bio !== undefined) profile.bio = bio.trim();
      if (favorite_cuisines !== undefined) profile.favorite_cuisines = favorite_cuisines;
      profile.review_count = user.review_count || 0;
      await profile.save();
    }

    res.json({ profile: formatProfileResponse(profile) });
  } catch (err) {
    handleError(res, err);
  }
};

module.exports = {
  me,
  updateMe,
  meBookmarks,
  meNotifications,
  addNotification,
  meRestaurant,
  meRestaurantReviews,
  getMyProfile,
  updateMyProfile
};
