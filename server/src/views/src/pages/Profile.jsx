import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getProfile, updateProfile, getBookmarks } from '../api/users'
import { useAuth } from '../context/AuthContext'
import Spinner from '../components/Spinner'
import StarRating from '../components/StarRating'

export default function Profile() {
  const { user, setUser } = useAuth()
  const [profile, setProfile] = useState(null)
  const [bookmarks, setBookmarks] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', avatar_url: '' })
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    Promise.all([getProfile(), getBookmarks()])
      .then(([pRes, bRes]) => {
        setProfile(pRes.data)
        setEditForm({ name: pRes.data.name || '', avatar_url: pRes.data.avatar_url || '' })
        setBookmarks(bRes.data.bookmarks || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async e => {
    e.preventDefault()
    setSaving(true)
    setSaveMsg('')
    setSaveError('')
    try {
      const res = await updateProfile(editForm)
      setProfile(p => ({ ...p, ...res.data }))
      setUser(u => ({ ...u, ...res.data }))
      setSaveMsg('Profile updated!')
      setEditing(false)
    } catch (err) {
      setSaveError(err.response?.data?.error?.message || 'Could not update profile.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="page-center"><Spinner /></div>

  const roleBadge = role => {
    const map = { admin: 'badge-admin', reviewer: 'badge-reviewer', user: 'badge-user' }
    return map[role] || 'badge-user'
  }

  return (
    <div className="container profile-page">
      <h1 className="page-title">My Profile</h1>

      <div className="profile-layout">
        {/* Profile Card */}
        <div className="profile-card card">
          <div className="profile-avatar">
            {profile?.avatar_url
              ? <img src={profile.avatar_url} alt="Avatar" className="avatar-img" />
              : <div className="avatar-placeholder">{profile?.name?.[0]?.toUpperCase() || 'U'}</div>
            }
          </div>
          <h2 className="profile-name">{profile?.name}</h2>
          <p className="profile-email">{profile?.email}</p>
          <span className={`badge ${roleBadge(profile?.role)}`}>{profile?.role}</span>
          <div className="profile-stats">
            <div className="profile-stat">
              <span className="stat-value">{profile?.review_count || 0}</span>
              <span className="stat-label">Reviews</span>
            </div>
            <div className="profile-stat">
              <span className="stat-value">{bookmarks.length}</span>
              <span className="stat-label">Bookmarks</span>
            </div>
          </div>
          <p className="profile-joined">Member since {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : '–'}</p>

          {!editing && (
            <button className="btn btn-outline btn-full" onClick={() => setEditing(true)}>Edit Profile</button>
          )}

          {editing && (
            <form onSubmit={handleSave} className="edit-profile-form">
              {saveError && <div className="alert alert-error">{saveError}</div>}
              <div className="form-group">
                <label className="label">Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={editForm.name}
                  onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="label">Avatar URL</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="https://example.com/photo.jpg"
                  value={editForm.avatar_url}
                  onChange={e => setEditForm(f => ({ ...f, avatar_url: e.target.value }))}
                />
              </div>
              <div className="btn-row">
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button type="button" className="btn btn-outline" onClick={() => setEditing(false)}>Cancel</button>
              </div>
            </form>
          )}
          {saveMsg && <p className="success-text">{saveMsg}</p>}
        </div>

        {/* Bookmarks */}
        <div className="profile-main">
          <h2 className="section-title">My Bookmarks</h2>
          {bookmarks.length === 0 ? (
            <div className="empty-state">
              <p>No bookmarks yet.</p>
              <Link to="/restaurants" className="btn btn-outline btn-sm">Browse Restaurants</Link>
            </div>
          ) : (
            <div className="bookmarks-list">
              {bookmarks.map((bm, i) => (
                <Link key={i} to={`/restaurants/${bm.restaurant_id}`} className="bookmark-item">
                  <div className="bookmark-info">
                    <h4>{bm.name}</h4>
                    <StarRating value={Math.round(bm.avg_rating || 0)} size="sm" />
                    <span className="rating-number">{bm.avg_rating ? Number(bm.avg_rating).toFixed(1) : '–'}</span>
                  </div>
                  <span className="bookmark-date">{new Date(bm.saved_at).toLocaleDateString()}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
