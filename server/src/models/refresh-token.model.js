const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema({
  tokenHash: {
    type: String,
    required: true,
    unique: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },
  createdByIp: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  },
  replacedByTokenHash: {
    type: String,
    default: null
  },
  revokedAt: {
    type: Date,
    default: null
  },
  revokedReason: {
    type: String,
    default: null
  },
  isRevoked: {
    type: Boolean,
    default: false,
    index: true
  }
}, { timestamps: true });

refreshTokenSchema.index({ tokenHash: 1 }, { unique: true });
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
refreshTokenSchema.index({ user: 1, isRevoked: 1, expiresAt: 1 });

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
