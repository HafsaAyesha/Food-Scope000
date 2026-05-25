const express = require('express');
const router = express.Router();
const Review = require('../models/review.model');
const Comment = require('../models/comment.model');
const { authenticate } = require('../middlewares/auth.middleware');
const { loadResource, requireOwnership } = require('../middlewares/ownership.middleware');
const {
  createComment,
  listComments,
  removeComment
} = require('../controllers/comments.controller');

const ensureCommentBelongsToReview = (req, res, next) => {
  if (String(req.comment.review_id) !== String(req.review._id)) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'COMMENTS_NOT_FOUND',
        type: 'NOT_FOUND_ERROR',
        message: 'Comment not found.',
        details: null
      }
    });
  }

  return next();
};

const loadReview = loadResource({
  model: Review,
  paramId: 'id',
  attachAs: 'review',
  notFoundCode: 'REVIEWS_NOT_FOUND',
  notFoundMessage: 'Review not found.',
  additionalQuery: { status: 'active' }
});

const loadComment = loadResource({
  model: Comment,
  paramId: 'comment_id',
  attachAs: 'comment',
  notFoundCode: 'COMMENTS_NOT_FOUND',
  notFoundMessage: 'Comment not found.'
});

router.post('/:id/comments', authenticate, loadReview, createComment);
router.get('/:id/comments', loadReview, listComments);
router.delete(
  '/:id/comments/:comment_id',
  authenticate,
  loadReview,
  loadComment,
  ensureCommentBelongsToReview,
  requireOwnership({
    resourceKey: 'comment',
    ownerField: 'user_id',
    forbiddenCode: 'COMMENTS_FORBIDDEN',
    forbiddenMessage: 'Not comment owner or admin.'
  }),
  removeComment
);

module.exports = router;
