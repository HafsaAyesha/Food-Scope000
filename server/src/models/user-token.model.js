const mongoose = require('mongoose');

const TOKEN_TYPES = ['password_reset', 'email_verification'];

const userTokenSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: TOKEN_TYPES,
    index: true
  },
  tokenHash: {
    type: String,
    required: true,
    unique: true,
    select: false
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },
  usedAt: {
    type: Date,
    default: null
  },
  revoked: {
    type: Boolean,
    default: false,
    index: true
  },
  createdByIp: {
    type: String,
    default: null
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { timestamps: true });

userTokenSchema.index({ user: 1, type: 1 });
userTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('UserToken', userTokenSchema);
