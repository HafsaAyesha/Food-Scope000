import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getRestaurants } from '../../api/restaurants'
import { updateRestaurantStatus } from '../../api/admin'
import Spinner from '../../components/Spinner'

export default function AdminRestaurants() {
  const [restaurants, setRestaurants] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [actionTarget, setActionTarget] = useState(null)
  const [actionForm, setActionForm] = useState({ status: '', reason: '' })
  const [actionLoading, setActionLoading] = useState(false)
  const [actionMsg, setActionMsg] = useState('')
  const limit = 15

  const fetchRestaurants = () => {
    setLoading(true)
    getRestaurants({ page, limit })
      .then(res => { setRestaurants(res.data.restaurants || []); setTotal(res.data.total || 0) })
      .catch(err => setError(err.response?.data?.error?.message || 'Failed to load restaurants.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchRestaurants() }, [page])

  const openAction = (restaurant) => {
    setActionTarget(restaurant)
    setActionForm({ status: '', reason: '' })
    setActionMsg('')
  }

  const handleAction = async e => {
    e.preventDefault()
    if (!actionForm.status) return
    setActionLoading(true)
    setActionMsg('')
    try {
      await updateRestaurantStatus(actionTarget.id || actionTarget._id, actionForm)
      setActionMsg('Status updated successfully!')
      setActionTarget(null)
      fetchRestaurants()
    } catch (err) {
      setActionMsg(err.response?.data?.error?.message || 'Could not update status.')
    } finally {
      setActionLoading(false)
    }
  }

  const totalPages = Math.ceil(total / limit)
  const needsReason = ['rejected', 'suspended'].includes(actionForm.status)

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <h3 className="admin-sidebar-title">Admin Panel</h3>
        <nav className="admin-nav">
          <Link to="/admin" className="admin-nav-link">📊 Dashboard</Link>
          <Link to="/admin/users" className="admin-nav-link">👥 Users</Link>
          <Link to="/admin/restaurants" className="admin-nav-link active">🏪 Restaurants</Link>
          <Link to="/admin/reviews" className="admin-nav-link">⭐ Reviews</Link>
        </nav>
      </aside>

      <div className="admin-content">
        <h1 className="admin-page-title">Restaurant Moderation</h1>
        <p className="admin-subtitle">{total} approved restaurants</p>

        {error && <div className="alert alert-error">{error}</div>}

        {/* Action Modal */}
        {actionTarget && (
          <div className="modal-overlay" onClick={() => setActionTarget(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h3>Change Status: {actionTarget.name}</h3>
              {actionMsg && <div className={`alert ${actionMsg.includes('success') ? 'alert-success' : 'alert-error'}`}>{actionMsg}</div>}
              <form onSubmit={handleAction}>
                <div className="form-group">
                  <label className="label">New Status</label>
                  <select
                    className="form-control"
                    value={actionForm.status}
                    onChange={e => setActionForm(f => ({ ...f, status: e.target.value }))}
                    required
                  >
                    <option value="">Select status...</option>
                    <option value="approved">Approved</option>
                    <option value="suspended">Suspended</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                {needsReason && (
                  <div className="form-group">
                    <label className="label">Reason *</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      placeholder="Reason for this action..."
                      value={actionForm.reason}
                      onChange={e => setActionForm(f => ({ ...f, reason: e.target.value }))}
                      required
                    />
                  </div>
                )}
                <div className="btn-row">
                  <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                    {actionLoading ? 'Updating...' : 'Update Status'}
                  </button>
                  <button type="button" className="btn btn-outline" onClick={() => setActionTarget(null)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {loading ? (
          <div className="center-spinner"><Spinner /></div>
        ) : (
          <>
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Cuisine</th>
                    <th>Price</th>
                    <th>Rating</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {restaurants.length === 0 ? (
                    <tr><td colSpan={5} className="table-empty">No restaurants found.</td></tr>
                  ) : restaurants.map(r => (
                    <tr key={r.id || r._id}>
                      <td>
                        <Link to={`/restaurants/${r.id || r._id}`} className="table-link">{r.name}</Link>
                      </td>
                      <td>{r.cuisine_type || '–'}</td>
                      <td>{r.price_range || '–'}</td>
                      <td>⭐ {r.avg_rating ? Number(r.avg_rating).toFixed(1) : '–'}</td>
                      <td>
                        <button className="btn btn-outline btn-xs" onClick={() => openAction(r)}>
                          Change Status
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button className="btn btn-outline btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                <span className="pagination-info">Page {page} of {totalPages}</span>
                <button className="btn btn-outline btn-sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
