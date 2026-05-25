const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  is_read: {
    type: Boolean,
    default: false,
    index: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  expiresAt: {
    type: Date,
    default: function () {
      return new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
    },
    index: true
  }
}, { timestamps: true });

notificationSchema.index({ user_id: 1, is_read: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Notification', notificationSchema);
