const mongoose = require('mongoose');

const bookmarkSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  restaurant_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true,
    index: true
  },
  restaurant_name: {
    type: String,
    required: true,
    trim: true
  },
  restaurant_avg_rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, { versionKey: false });

bookmarkSchema.index({ user_id: 1, restaurant_id: 1 }, { unique: true });
bookmarkSchema.index({ user_id: 1, createdAt: -1 });

module.exports = mongoose.model('Bookmark', bookmarkSchema);
