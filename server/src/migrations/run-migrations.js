const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const User = require('../models/auth.model');
const Restaurant = require('../models/restaurant.model');
const Tag = require('../models/tag.model');
const Dish = require('../models/dish.model');
const Review = require('../models/review.model');
const ReviewVote = require('../models/review-vote.model');
const Bookmark = require('../models/bookmark.model');
const Notification = require('../models/notification.model');
const RefreshToken = require('../models/refresh-token.model');
const UserToken = require('../models/user-token.model');

const normalizeText = (value) => String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');

const migrateRestaurantNormalization = async () => {
  const restaurants = await Restaurant.find({
    $or: [
      { name_normalized: { $exists: false } },
      { address_normalized: { $exists: false } }
    ]
  });

  for (const restaurant of restaurants) {
    restaurant.name_normalized = normalizeText(restaurant.name);
    restaurant.address_normalized = normalizeText(restaurant.address);
    restaurant.tags = restaurant.tags || [];
    await restaurant.save();
  }
  console.log(`Restaurant normalization updated for ${restaurants.length} document(s).`);
};

const migrateTagNames = async () => {
  const tags = await Tag.find({ $or: [ { name_lower: { $exists: false } }, { name_lower: '' } ] });
  for (const tag of tags) {
    tag.name = String(tag.name || '').trim();
    tag.name_lower = tag.name.toLowerCase();
    await tag.save();
  }
  console.log(`Tag normalization updated for ${tags.length} document(s).`);
};

const migrateBookmarksAndNotifications = async () => {
  const users = await User.find({ $or: [ { bookmarks: { $exists: true, $ne: [] } }, { notifications: { $exists: true, $ne: [] } } ] });
  let bookmarkCount = 0;
  let notificationCount = 0;

  for (const user of users) {
    if (Array.isArray(user.bookmarks) && user.bookmarks.length > 0) {
      const bookmarks = user.bookmarks.map((bookmark) => ({
        user_id: user._id,
        restaurant_id: bookmark.restaurant_id,
        restaurant_name: bookmark.name,
        restaurant_avg_rating: bookmark.avg_rating || 0,
        createdAt: bookmark.saved_at || new Date()
      }));
      const inserted = await Bookmark.insertMany(bookmarks, { ordered: false }).catch(() => []);
      bookmarkCount += Array.isArray(inserted) ? inserted.length : 0;
    }

    if (Array.isArray(user.notifications) && user.notifications.length > 0) {
      const notifications = user.notifications.map((notification) => ({
        user_id: user._id,
        type: notification.type,
        message: notification.message,
        is_read: notification.is_read || false,
        createdAt: notification.created_at || new Date(),
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      }));
      const inserted = await Notification.insertMany(notifications, { ordered: false }).catch(() => []);
      notificationCount += Array.isArray(inserted) ? inserted.length : 0;
    }

    if (user.bookmarks && user.bookmarks.length > 0) user.bookmarks = [];
    if (user.notifications && user.notifications.length > 0) user.notifications = [];
    await user.save();
  }

  console.log(`Migrated ${bookmarkCount} bookmark(s) and ${notificationCount} notification(s).`);
};

const migrateReviewVotes = async () => {
  const reviews = await Review.find({ votes: { $exists: true, $ne: [] } });
  let migrated = 0;

  for (const review of reviews) {
    const votes = review.votes || [];
    const voteDocs = votes.map((vote) => ({
      review_id: review._id,
      user_id: vote.user_id,
      vote_type: vote.vote_type,
      createdAt: vote.createdAt || review.createdAt
    }));
    if (voteDocs.length > 0) {
      await ReviewVote.insertMany(voteDocs, { ordered: false }).catch(() => {});
      migrated += voteDocs.length;
    }
    if (review.votes && review.votes.length > 0) {
      review.votes = [];
      await review.save();
    }
  }

  console.log(`Migrated ${migrated} vote(s) from embedded review arrays into ReviewVote documents.`);
};

const moveDishCollection = async () => {
  const db = mongoose.connection.db;
  const collections = await db.listCollections({ name: 'fooditems' }).toArray();
  if (collections.length === 0) {
    console.log('No legacy fooditems collection found.');
    return;
  }
  const target = 'dishes';
  const exists = await db.listCollections({ name: target }).toArray();
  if (exists.length > 0) {
    console.log('Target dishes collection already exists; manual merge may be required.');
    return;
  }
  await db.renameCollection('fooditems', target);
  console.log('Renamed legacy fooditems collection to dishes.');
};

const migrateUserTokens = async () => {
  const users = await User.find({
    $or: [
      { passwordResetToken: { $exists: true, $ne: null } },
      { emailVerificationToken: { $exists: true, $ne: null } }
    ]
  });
  let tokenCount = 0;

  for (const user of users) {
    if (user.passwordResetToken) {
      await UserToken.create({
        user: user._id,
        type: 'password_reset',
        tokenHash: user.passwordResetToken,
        expiresAt: user.passwordResetExpires || new Date(Date.now() + 30 * 60 * 1000)
      });
      user.passwordResetToken = null;
      user.passwordResetExpires = null;
      tokenCount += 1;
    }
    if (user.emailVerificationToken) {
      await UserToken.create({
        user: user._id,
        type: 'email_verification',
        tokenHash: user.emailVerificationToken,
        expiresAt: user.emailVerificationExpires || new Date(Date.now() + 24 * 60 * 60 * 1000)
      });
      user.emailVerificationToken = null;
      user.emailVerificationExpires = null;
      tokenCount += 1;
    }
    await user.save();
  }

  console.log(`Migrated ${tokenCount} ephemeral user token(s) into the dedicated UserToken collection.`);
};

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { autoIndex: false });
    console.log('Connected to MongoDB for migration.');

    await migrateRestaurantNormalization();
    await migrateTagNames();
    await migrateBookmarksAndNotifications();
    await migrateReviewVotes();
    await moveDishCollection();
    await migrateUserTokens();

    console.log('Migration complete.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

run();
