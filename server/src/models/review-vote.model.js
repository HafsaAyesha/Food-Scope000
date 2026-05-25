const mongoose = require('mongoose');

const reviewVoteSchema = new mongoose.Schema({
  review_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review',
    required: true,
    index: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  vote_type: {
    type: String,
    required: true,
    enum: ['helpful', 'not_helpful'],
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, { timestamps: true });

reviewVoteSchema.index({ review_id: 1, user_id: 1 }, { unique: true });
reviewVoteSchema.index({ user_id: 1, createdAt: -1 });
reviewVoteSchema.index({ review_id: 1, vote_type: 1 });

module.exports = mongoose.model('ReviewVote', reviewVoteSchema);
