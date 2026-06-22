const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  role: {
    type: String,
    enum: ['user', 'reviewer'],
    required: true,
    index: true
  },
  bio: {
    type: String,
    default: '',
    trim: true,
    maxlength: 1000
  },
  favorite_cuisines: {
    type: [String],
    default: [],
    set: (value) => Array.isArray(value)
      ? [...new Set(value.map((c) => String(c).trim().toLowerCase()).filter(Boolean))]
      : []
  },
  review_count: {
    type: Number,
    default: 0,
    min: 0
  },
  business_description: {
    type: String,
    default: '',
    trim: true,
    maxlength: 2000
  },
  contact: {
    type: String,
    default: '',
    trim: true,
    maxlength: 200
  },
  restaurant_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('Profile', profileSchema);
