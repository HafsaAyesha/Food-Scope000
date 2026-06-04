const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth.middleware');
const { requireOwnership } = require('../middlewares/ownership.middleware');
const { loadReview, preventSelfVote } = require('../middlewares/review.middleware');
const {
  createNewReview,
  listReviews,
  updateExistingReview,
  removeReview,
  voteOnReview,
  flagReview
} = require('../controllers/reviews.controller');

router.post('/', authenticate, createNewReview);
router.get('/', listReviews);
router.put('/:id', authenticate, loadReview, requireOwnership({
  resourceKey: 'review',
  ownerField: 'user_id',
  forbiddenCode: 'REVIEWS_FORBIDDEN',
  forbiddenMessage: 'Not review owner or admin.'
}), updateExistingReview);
router.delete('/:id', authenticate, loadReview, requireOwnership({
  resourceKey: 'review',
  ownerField: 'user_id',
  forbiddenCode: 'REVIEWS_FORBIDDEN',
  forbiddenMessage: 'Not review owner or admin.'
}), removeReview);
router.post('/:id/vote', authenticate, loadReview, preventSelfVote, voteOnReview);
router.post('/:id/flag', authenticate, flagReview);

module.exports = router;
