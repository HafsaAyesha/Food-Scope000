import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getReviews } from '../../api/reviews'
import { moderateReview } from '../../api/admin'
import StarRating from '../../components/StarRating'
import Spinner from '../../components/Spinner'

export default function AdminReviews() {
  const [restaurantId, setRestaurantId] = useState('')
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState('')
  const [actionTarget, setActionTarget] = useState(null)
  const [actionForm, setActionForm] = useState({ action: '', reason: '' })
  const [actionLoading, setActionLoading] = useState(false)
  const [actionMsg, setActionMsg] = useState('')

  const fetchReviews = e => {
    e.preventDefault()
    if (!restaurantId.trim()) return
    setLoading(true)
    setError('')
    setSearched(true)
    getReviews({ restaurant_id: restaurantId.trim(), limit: 50 })
      .then(res => setReviews(res.data.reviews || []))
      .catch(err => setError(err.response?.data?.error?.message || 'Could not load reviews.'))
      .finally(() => setLoading(false))
  }

  const openAction = review => {
    setActionTarget(review)
    setActionForm({ action: '', reason: '' })
    setActionMsg('')
  }

  const handleModerate = async e => {
    e.preventDefault()
    if (!actionForm.action) return
    setActionLoading(true)
    setActionMsg('')
    try {
      await moderateReview(actionTarget.id || actionTarget._id, actionForm)
      setActionMsg('Review moderated successfully!')
      setActionTarget(null)
      // Re-fetch
      const res = await getReviews({ restaurant_id: restaurantId, limit: 50 })
      setReviews(res.data.reviews || [])
    } catch (err) {
      setActionMsg(err.response?.data?.error?.message || 'Could not moderate review.')
    } finally {
      setActionLoading(false)
    }
  }

  const needsReason = actionForm.action === 'hide'

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <h3 className="admin-sidebar-title">Admin Panel</h3>
        <nav className="admin-nav">
          <Link to="/admin" className="admin-nav-link">📊 Dashboard</Link>
          <Link to="/admin/users" className="admin-nav-link">👥 Users</Link>
          <Link to="/admin/restaurants" className="admin-nav-link">🏪 Restaurants</Link>
          <Link to="/admin/reviews" className="admin-nav-link active">⭐ Reviews</Link>
        </nav>
      </aside>

      <div className="admin-content">
        <h1 className="admin-page-title">Review Moderation</h1>

        <div className="card admin-search-card">
          <p className="admin-note">Enter a Restaurant ID to load and moderate its reviews.</p>
          <form onSubmit={fetchReviews} className="admin-search-form">
            <input
              type="text"
              className="form-control"
              placeholder="Restaurant ID..."
              value={restaurantId}
              onChange={e => setRestaurantId(e.target.value)}
            />
            <button type="submit" className="btn btn-primary">Load Reviews</button>
          </form>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {/* Moderate modal */}
        {actionTarget && (
          <div className="modal-overlay" onClick={() => setActionTarget(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h3>Moderate Review</h3>
              <p className="modal-preview">"{actionTarget.body?.slice(0, 100)}{actionTarget.body?.length > 100 ? '...' : ''}"</p>
              {actionMsg && <div className={`alert ${actionMsg.includes('success') ? 'alert-success' : 'alert-error'}`}>{actionMsg}</div>}
              <form onSubmit={handleModerate}>
                <div className="form-group">
                  <label className="label">Action</label>
                  <select
                    className="form-control"
                    value={actionForm.action}
                    onChange={e => setActionForm(f => ({ ...f, action: e.target.value }))}
                    required
                  >
                    <option value="">Select action...</option>
                    <option value="hide">Hide review</option>
                    <option value="restore">Restore review</option>
                  </select>
                </div>
                {needsReason && (
                  <div className="form-group">
                    <label className="label">Reason *</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      placeholder="Why are you hiding this review?"
                      value={actionForm.reason}
                      onChange={e => setActionForm(f => ({ ...f, reason: e.target.value }))}
                      required
                    />
                  </div>
                )}
                <div className="btn-row">
                  <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                    {actionLoading ? 'Processing...' : 'Apply'}
                  </button>
                  <button type="button" className="btn btn-outline" onClick={() => setActionTarget(null)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {loading && <div className="center-spinner"><Spinner /></div>}

        {!loading && searched && reviews.length === 0 && !error && (
          <div className="empty-state">No reviews found for this restaurant.</div>
        )}

        {!loading && reviews.length > 0 && (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Rating</th>
                  <th>Review</th>
                  <th>Date</th>
                  <th>Votes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map(r => (
                  <tr key={r.id || r._id}>
                    <td>{r.user?.name || 'Unknown'}</td>
                    <td><StarRating value={r.rating} size="sm" /></td>
                    <td className="review-body-cell">{r.body?.slice(0, 80)}{r.body?.length > 80 ? '...' : ''}</td>
                    <td>{new Date(r.created_at).toLocaleDateString()}</td>
                    <td>👍 {r.helpful_count} · 👎 {r.not_helpful_count}</td>
                    <td>
                      <button className="btn btn-outline btn-xs" onClick={() => openAction(r)}>Moderate</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
