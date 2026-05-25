const User = require('../models/auth.model');
const Bookmark = require('../models/bookmark.model');
const Notification = require('../models/notification.model');
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

module.exports = { me, updateMe, meBookmarks, meNotifications, addNotification };
