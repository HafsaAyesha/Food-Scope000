import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getAdminUsers } from '../../api/admin'
import Spinner from '../../components/Spinner'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({ role: '', status: '' })
  const [page, setPage] = useState(1)
  const limit = 20

  const fetchUsers = () => {
    setLoading(true)
    const params = { page, limit }
    if (filters.role) params.role = filters.role
    if (filters.status) params.status = filters.status
    getAdminUsers(params)
      .then(res => { setUsers(res.data.users || []); setTotal(res.data.total || 0) })
      .catch(err => setError(err.response?.data?.error?.message || 'Failed to load users.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchUsers() }, [page, filters])

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <h3 className="admin-sidebar-title">Admin Panel</h3>
        <nav className="admin-nav">
          <Link to="/admin" className="admin-nav-link">📊 Dashboard</Link>
          <Link to="/admin/users" className="admin-nav-link active">👥 Users</Link>
          <Link to="/admin/restaurants" className="admin-nav-link">🏪 Restaurants</Link>
          <Link to="/admin/reviews" className="admin-nav-link">⭐ Reviews</Link>
        </nav>
      </aside>

      <div className="admin-content">
        <h1 className="admin-page-title">User Management</h1>
        <p className="admin-subtitle">{total} total users</p>

        {error && <div className="alert alert-error">{error}</div>}

        {/* Filters */}
        <div className="admin-filters">
          <select
            className="form-control form-control-sm"
            value={filters.role}
            onChange={e => { setFilters(f => ({ ...f, role: e.target.value })); setPage(1) }}
          >
            <option value="">All Roles</option>
            <option value="user">User</option>
            <option value="reviewer">Reviewer</option>
            <option value="admin">Admin</option>
          </select>
          <select
            className="form-control form-control-sm"
            value={filters.status}
            onChange={e => { setFilters(f => ({ ...f, status: e.target.value })); setPage(1) }}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        {loading ? (
          <div className="center-spinner"><Spinner /></div>
        ) : (
          <>
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Reviews</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr><td colSpan={5} className="table-empty">No users found.</td></tr>
                  ) : users.map(u => (
                    <tr key={u.id || u._id}>
                      <td>
                        <div className="table-user">
                          <span className="avatar-xs">{u.name?.[0]?.toUpperCase() || 'U'}</span>
                          {u.name}
                        </div>
                      </td>
                      <td>{u.email}</td>
                      <td><span className={`badge badge-${u.role}`}>{u.role}</span></td>
                      <td>
                        <span className={`status-dot ${u.status === 'suspended' ? 'suspended' : 'active'}`}>
                          {u.status}
                        </span>
                      </td>
                      <td>{u.review_count || 0}</td>
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
