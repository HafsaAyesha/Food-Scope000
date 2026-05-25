import { useState } from 'react'
import StarRating from './StarRating'
import CommentSection from './CommentSection'
import { voteReview, deleteReview, updateReview } from '../api/reviews'
import { useAuth } from '../context/AuthContext'
import { formatDate } from '../utils/format'
import { getErrorMessage } from '../utils/errors'

export default function ReviewCard({ review, onUpdated }) {
  const { user } = useAuth()
  const [showComments, setShowComments] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editRating, setEditRating] = useState(review.rating)
  const [editBody, setEditBody] = useState(review.body)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [voteMsg, setVoteMsg] = useState('')

  const reviewId = review.id || review._id
  const userId = user?.id || user?._id
  const isOwn = userId && String(userId) === String(review.user?.id || review.user?._id)

  const handleVote = async type => {
    if (!user) return alert('Please log in to vote.')
    setVoteMsg('')
    try {
      await voteReview(reviewId, { vote_type: type })
      setVoteMsg('Vote recorded!')
      onUpdated && onUpdated()
    } catch (err) {
      setVoteMsg(getErrorMessage(err, 'Could not vote.'))
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete this review?')) return
    try {
      await deleteReview(reviewId)
      onUpdated && onUpdated()
    } catch (err) {
      alert(getErrorMessage(err, 'Could not delete review.'))
    }
  }

  const handleSaveEdit = async e => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await updateReview(reviewId, { rating: editRating, body: editBody })
      setEditing(false)
      onUpdated && onUpdated()
    } catch (err) {
      setError(getErrorMessage(err, 'Could not save changes.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="review-card">
      <div className="review-header">
        <div className="review-user">
          <span className="avatar-sm">{review.user?.name?.[0]?.toUpperCase() || 'U'}</span>
          <span className="review-author">{review.user?.name || 'Anonymous'}</span>
        </div>
        <div className="review-meta">
          <StarRating value={review.rating} size="sm" />
          <span className="review-date">{formatDate(review.createdAt || review.created_at)}</span>
        </div>
      </div>

      {editing ? (
        <form onSubmit={handleSaveEdit} className="edit-review-form">
          {error && <p className="error-text">{error}</p>}
          <div className="form-group">
            <label className="label">Rating</label>
            <StarRating value={editRating} onChange={setEditRating} />
          </div>
          <div className="form-group">
            <label className="label">Review</label>
            <textarea
              value={editBody}
              onChange={e => setEditBody(e.target.value)}
              rows={3}
              className="form-control"
            />
          </div>
          <div className="btn-row">
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setEditing(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <p className="review-body">{review.body || <em>No text provided.</em>}</p>
      )}

      {review.photos?.length > 0 && (
        <div className="review-photos">
          {review.photos.map((photo, i) => (
            <img key={i} src={photo} alt={`Review photo ${i + 1}`} className="review-photo" />
          ))}
        </div>
      )}

      <div className="review-actions">
        <div className="vote-buttons">
          <button className="vote-btn" onClick={() => handleVote('helpful')} title="Helpful">
            👍 {review.helpful_count || 0}
          </button>
          <button className="vote-btn" onClick={() => handleVote('not_helpful')} title="Not helpful">
            👎 {review.not_helpful_count || 0}
          </button>
          {voteMsg && <span className="vote-msg">{voteMsg}</span>}
        </div>
        <div className="review-owner-actions">
          {isOwn && !editing && (
            <>
              <button className="btn-text" onClick={() => setEditing(true)}>Edit</button>
              <button className="btn-text danger" onClick={handleDelete}>Delete</button>
            </>
          )}
          <button className="btn-text" onClick={() => setShowComments(v => !v)}>
            💬 {showComments ? 'Hide Comments' : 'Comments'}
          </button>
        </div>
      </div>

      {showComments && <CommentSection reviewId={reviewId} />}
    </div>
  )
}
