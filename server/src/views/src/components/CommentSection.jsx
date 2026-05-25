import { useState, useEffect } from 'react'
import { getComments, createComment, deleteComment } from '../api/reviews'
import { useAuth } from '../context/AuthContext'
import Spinner from './Spinner'

function CommentItem({ comment, reviewId, userId, onDelete, depth = 0 }) {
  const [showReply, setShowReply] = useState(false)
  const [replyBody, setReplyBody] = useState('')
  const [replying, setReplying] = useState(false)
  const [error, setError] = useState('')

  const handleReply = async e => {
    e.preventDefault()
    if (!replyBody.trim()) return
    setReplying(true)
    setError('')
    try {
      await createComment(reviewId, { body: replyBody, parent_comment_id: comment.id || comment._id })
      setReplyBody('')
      setShowReply(false)
      onDelete() // re-fetch
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Could not post reply.')
    } finally {
      setReplying(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete this comment?')) return
    try {
      await deleteComment(reviewId, comment.id || comment._id)
      onDelete()
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Could not delete comment.')
    }
  }

  const isOwn = userId && String(userId) === String(comment.user?.id || comment.user?._id)

  return (
    <div className={`comment depth-${depth}`}>
      <div className="comment-header">
        <span className="comment-avatar">{comment.user?.name?.[0]?.toUpperCase() || 'U'}</span>
        <span className="comment-author">{comment.user?.name || 'User'}</span>
        <span className="comment-date">{new Date(comment.created_at).toLocaleDateString()}</span>
        {isOwn && (
          <button className="btn-text danger" onClick={handleDelete}>Delete</button>
        )}
      </div>
      <p className="comment-body">{comment.body}</p>
      {depth < 2 && userId && (
        <button className="btn-text" onClick={() => setShowReply(v => !v)}>
          {showReply ? 'Cancel' : 'Reply'}
        </button>
      )}
      {showReply && (
        <form onSubmit={handleReply} className="reply-form">
          {error && <p className="error-text">{error}</p>}
          <textarea
            value={replyBody}
            onChange={e => setReplyBody(e.target.value)}
            placeholder="Write a reply..."
            rows={2}
            className="form-control"
          />
          <button type="submit" className="btn btn-primary btn-sm" disabled={replying}>
            {replying ? 'Posting...' : 'Post Reply'}
          </button>
        </form>
      )}
      {comment.replies?.length > 0 && (
        <div className="comment-replies">
          {comment.replies.map(reply => (
            <CommentItem
              key={reply.id || reply._id}
              comment={reply}
              reviewId={reviewId}
              userId={userId}
              onDelete={onDelete}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function CommentSection({ reviewId }) {
  const { user } = useAuth()
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const fetchComments = () => {
    setLoading(true)
    getComments(reviewId)
      .then(res => setComments(res.data.comments || []))
      .catch(() => setComments([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchComments() }, [reviewId])

  const handleSubmit = async e => {
    e.preventDefault()
    if (!body.trim()) return
    setSubmitting(true)
    setError('')
    try {
      await createComment(reviewId, { body })
      setBody('')
      fetchComments()
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Could not post comment.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="comment-section">
      <h4 className="comment-section-title">Comments ({comments.length})</h4>

      {user && (
        <form onSubmit={handleSubmit} className="comment-form">
          {error && <p className="error-text">{error}</p>}
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Write a comment..."
            rows={2}
            className="form-control"
          />
          <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
            {submitting ? 'Posting...' : 'Post Comment'}
          </button>
        </form>
      )}

      {loading ? (
        <Spinner size="sm" />
      ) : comments.length === 0 ? (
        <p className="empty-state-sm">No comments yet. Be the first!</p>
      ) : (
        <div className="comment-list">
          {comments.map(comment => (
            <CommentItem
              key={comment.id || comment._id}
              comment={comment}
              reviewId={reviewId}
              userId={user?.id || user?._id}
              onDelete={fetchComments}
              depth={0}
            />
          ))}
        </div>
      )}
    </div>
  )
}
