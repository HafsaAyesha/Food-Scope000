const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '..', '.env') });

const User = require('../../models/auth.model');
const Restaurant = require('../../models/restaurant.model');
const Review = require('../../models/review.model');
const Dish = require('../../models/dish.model');
const Bookmark = require('../../models/bookmark.model');
const Notification = require('../../models/notification.model');
const ReviewVote = require('../../models/review-vote.model');
const RefreshToken = require('../../models/refresh-token.model');
const UserToken = require('../../models/user-token.model');

const runIntegrityChecks = async () => {
  const orphans = [];

  const restaurantIds = await Restaurant.distinct('_id');
  const userIds = await User.distinct('_id');

  const orphanBookmarks = await Bookmark.find({
    $or: [
      { user_id: { $nin: userIds } },
      { restaurant_id: { $nin: restaurantIds } }
    ]
  }).select('_id user_id restaurant_id');
  if (orphanBookmarks.length) orphans.push({ collection: 'Bookmark', count: orphanBookmarks.length });

  const orphanNotifications = await Notification.find({ user_id: { $nin: userIds } }).select('_id user_id');
  if (orphanNotifications.length) orphans.push({ collection: 'Notification', count: orphanNotifications.length });

  const orphanReviews = await Review.find({ user_id: { $nin: userIds } }).select('_id user_id');
  if (orphanReviews.length) orphans.push({ collection: 'Review', count: orphanReviews.length });

  const orphanDishes = await Dish.find({ restaurant_id: { $nin: restaurantIds } }).select('_id restaurant_id');
  if (orphanDishes.length) orphans.push({ collection: 'Dish', count: orphanDishes.length });

  const orphanVotes = await ReviewVote.find({
    $or: [
      { user_id: { $nin: userIds } },
      { review_id: { $nin: await Review.distinct('_id') } }
    ]
  }).select('_id review_id user_id');
  if (orphanVotes.length) orphans.push({ collection: 'ReviewVote', count: orphanVotes.length });

  const orphanRefreshTokens = await RefreshToken.find({ user: { $nin: userIds } }).select('_id user');
  if (orphanRefreshTokens.length) orphans.push({ collection: 'RefreshToken', count: orphanRefreshTokens.length });

  const orphanUserTokens = await UserToken.find({ user: { $nin: userIds } }).select('_id user');
  if (orphanUserTokens.length) orphans.push({ collection: 'UserToken', count: orphanUserTokens.length });

  return orphans;
};

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { autoIndex: false });
    console.log('Connected to MongoDB for integrity checks.');
    const orphanSummary = await runIntegrityChecks();
    if (orphanSummary.length === 0) {
      console.log('No orphaned documents found.');
    } else {
      console.log('Orphaned document summary:', orphanSummary);
    }
    process.exit(0);
  } catch (error) {
    console.error('Integrity check failed:', error);
    process.exit(1);
  }
};

run();
