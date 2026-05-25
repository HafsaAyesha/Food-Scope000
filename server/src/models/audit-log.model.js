const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  actor_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true
  },
  action_type: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  target_entity: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  target_id: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
    index: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  retentionExpiresAt: {
    type: Date,
    default: function () {
      return new Date(Date.now() + 730 * 24 * 60 * 60 * 1000);
    },
    index: true
  }
}, { timestamps: { createdAt: 'timestamp', updatedAt: false } });

auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ retentionExpiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
