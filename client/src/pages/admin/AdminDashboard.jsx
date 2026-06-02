import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getAnalytics } from '../../api/admin'
import StarRating from '../../components/StarRating'
import Spinner from '../../components/Spinner'

function StatCard({ label, value, icon, color }) {
  return (
    <div className="stat-card" style={{ borderTopColor: color }}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-value">{value ?? '–'}</div>
      <div className="stat-label">{label}</div>
    </div>
  )
}

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getAnalytics()
      .then(res => setAnalytics(res.data))
      .catch(err => setError(err.response?.data?.error?.message || 'Failed to load analytics.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="page-center"><Spinner /></div>

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <h3 className="admin-sidebar-title">Admin Panel</h3>
        <nav className="admin-nav">
          <Link to="/admin" className="admin-nav-link active">📊 Dashboard</Link>
          <Link to="/admin/users" className="admin-nav-link">👥 Users</Link>
          <Link to="/admin/restaurants" className="admin-nav-link">🏪 Restaurants</Link>
          <Link to="/admin/reviews" className="admin-nav-link">⭐ Reviews</Link>
        </nav>
      </aside>

      <div className="admin-content">
        <h1 className="admin-page-title">Platform Analytics</h1>

        {error && <div className="alert alert-error">{error}</div>}

        {analytics && (
          <>
            <div className="stats-grid">
              <StatCard label="Total Users" value={analytics.total_users} icon="👥" color="#f97316" />
              <StatCard label="Total Restaurants" value={analytics.total_restaurants} icon="🏪" color="#06b6d4" />
              <StatCard label="Total Reviews" value={analytics.total_reviews} icon="⭐" color="#8b5cf6" />
              <StatCard label="Pending Approval" value={analytics.pending_restaurants} icon="⏳" color="#f59e0b" />
            </div>

            <div className="analytics-grid">
              <div className="card analytics-card">
                <h3>Top Rated Restaurants</h3>
                {analytics.top_rated_restaurants?.length === 0 ? (
                  <p className="empty-state-sm">No data yet.</p>
                ) : (
                  <div className="analytics-list">
                    {analytics.top_rated_restaurants?.map((r, i) => (
                      <Link key={r.id || r._id} to={`/restaurants/${r.id || r._id}`} className="analytics-list-item">
                        <span className="rank">#{i + 1}</span>
                        <div className="analytics-item-info">
                          <span className="analytics-item-name">{r.name}</span>
                          <span className="analytics-item-sub">{r.cuisine_type} · {r.price_range}</span>
                        </div>
                        <div className="analytics-item-rating">
                          <StarRating value={Math.round(r.avg_rating || 0)} size="sm" />
                          <span>{Number(r.avg_rating || 0).toFixed(1)}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div className="card analytics-card">
                <h3>Most Active Reviewers</h3>
                {analytics.most_active_reviewers?.length === 0 ? (
                  <p className="empty-state-sm">No data yet.</p>
                ) : (
                  <div className="analytics-list">
                    {analytics.most_active_reviewers?.map((u, i) => (
                      <div key={u.id || u._id} className="analytics-list-item">
                        <span className="rank">#{i + 1}</span>
                        <div className="analytics-item-info">
                          <span className="analytics-item-name">{u.name}</span>
                          <span className="analytics-item-sub">{u.email}</span>
                        </div>
                        <span className="analytics-count">{u.review_count} reviews</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
