import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  getProfile,
  updateProfile,
  getBookmarks,
  getMeProfile,
  updateMeProfile,
  getMyRestaurant
} from '../api/users'
import { useAuth } from '../context/AuthContext'
import Spinner from '../components/Spinner'
import StarRating from '../components/StarRating'

export default function Profile() {
  const { user, setUser } = useAuth()
  const [profile, setProfile] = useState(null)
  const [extendedProfile, setExtendedProfile] = useState(null)
  const [myRestaurant, setMyRestaurant] = useState(null)
  const [bookmarks, setBookmarks] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editingExtended, setEditingExtended] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', avatar_url: '' })
  const [extendedForm, setExtendedForm] = useState({
    bio: '',
    favorite_cuisines: '',
    business_description: '',
    contact: ''
  })
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [saveError, setSaveError] = useState('')

  const isReviewer = profile?.role === 'reviewer'
  const isUser = profile?.role === 'user'

  useEffect(() => {
    const requests = [
      getProfile(),
      getBookmarks(),
      getMeProfile()
    ]
    if (user?.role === 'reviewer') {
      requests.push(getMyRestaurant().catch(() => ({ data: null })))
    }

    Promise.all(requests)
      .then((results) => {
        const [pRes, bRes, extRes, restaurantRes] = results
        setProfile(pRes.data)
        setEditForm({ name: pRes.data.name || '', avatar_url: pRes.data.avatar_url || '' })
        setBookmarks(bRes.data.bookmarks || [])

        const ext = extRes.data?.profile
        setExtendedProfile(ext)
        if (ext?.role === 'user') {
          setExtendedForm({
            bio: ext.bio || '',
            favorite_cuisines: (ext.favorite_cuisines || []).join(', '),
            business_description: '',
            contact: ''
          })
        } else if (ext?.role === 'reviewer') {
          setExtendedForm({
            bio: '',
            favorite_cuisines: '',
            business_description: ext.business_description || '',
            contact: ext.contact || ''
          })
        }

        if (restaurantRes?.data) {
          setMyRestaurant(restaurantRes.data)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user?.role])

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

  const handleSaveExtended = async e => {
    e.preventDefault()
    setSaving(true)
    setSaveMsg('')
    setSaveError('')
    try {
      const payload = isReviewer
        ? {
            business_description: extendedForm.business_description,
            contact: extendedForm.contact
          }
        : {
            bio: extendedForm.bio,
            favorite_cuisines: extendedForm.favorite_cuisines
              .split(',')
              .map(c => c.trim())
              .filter(Boolean)
          }
      const res = await updateMeProfile(payload)
      setExtendedProfile(res.data.profile)
      if (res.data.profile?.role === 'user') {
        setExtendedForm({
          bio: res.data.profile.bio || '',
          favorite_cuisines: (res.data.profile.favorite_cuisines || []).join(', '),
          business_description: '',
          contact: ''
        })
      } else if (res.data.profile?.role === 'reviewer') {
        setExtendedForm({
          bio: '',
          favorite_cuisines: '',
          business_description: res.data.profile.business_description || '',
          contact: res.data.profile.contact || ''
        })
      }
      setSaveMsg('Profile details saved!')
      setEditingExtended(false)
    } catch (err) {
      setSaveError(err.response?.data?.error?.message || 'Could not save profile details.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="page-center"><Spinner /></div>

  const roleBadge = role => {
    const map = { admin: 'badge-admin', reviewer: 'badge-reviewer', user: 'badge-user' }
    return map[role] || 'badge-user'
  }

  const reviewsReceived = isReviewer ? (myRestaurant?.total_reviews ?? 0) : null
  const reviewsWritten = profile?.review_count || 0

  return (
    <div className="container profile-page">
      <h1 className="page-title">My Profile</h1>

      <div className="profile-layout">
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
            {isReviewer ? (
              <div className="profile-stat">
                <span className="stat-value">{reviewsReceived}</span>
                <span className="stat-label">Reviews received</span>
              </div>
            ) : (
              <div className="profile-stat">
                <span className="stat-value">{reviewsWritten}</span>
                <span className="stat-label">Reviews</span>
              </div>
            )}
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
          {saveMsg && !editingExtended && <p className="success-text">{saveMsg}</p>}
        </div>

        <div className="profile-main">
          <div className="card create-restaurant-form-card">
            <h2 className="section-title">
              {isReviewer ? 'Reviewer profile' : 'About me'}
            </h2>

            {isReviewer && (
              <>
                <div className="form-group">
                  <label className="label">Business description</label>
                  {editingExtended ? (
                    <textarea
                      className="form-control"
                      rows={4}
                      value={extendedForm.business_description}
                      onChange={e => setExtendedForm(f => ({ ...f, business_description: e.target.value }))}
                    />
                  ) : (
                    <p className="profile-email">
                      {extendedProfile?.business_description || <em>Not set yet.</em>}
                    </p>
                  )}
                </div>
                <div className="form-group">
                  <label className="label">Contact info</label>
                  {editingExtended ? (
                    <input
                      type="text"
                      className="form-control"
                      value={extendedForm.contact}
                      onChange={e => setExtendedForm(f => ({ ...f, contact: e.target.value }))}
                    />
                  ) : (
                    <p className="profile-email">
                      {extendedProfile?.contact || <em>Not set yet.</em>}
                    </p>
                  )}
                </div>
                <div className="form-group">
                  <label className="label">Linked restaurant</label>
                  {myRestaurant ? (
                    <p className="profile-email">
                      <Link to={`/restaurants/${myRestaurant.id || myRestaurant._id}`} className="btn-text">
                        {myRestaurant.name}
                      </Link>
                      {myRestaurant.status === 'pending' && (
                        <span className="badge badge-reviewer"> pending approval</span>
                      )}
                    </p>
                  ) : (
                    <p className="empty-state-sm">
                      No restaurant yet.{' '}
                      <Link to="/restaurants/new" className="btn-text">Create one</Link>
                    </p>
                  )}
                </div>
                <div className="form-group">
                  <label className="label">Reviews received on your restaurant</label>
                  <p className="stat-value">{reviewsReceived ?? 0}</p>
                </div>
              </>
            )}

            {isUser && (
              <>
                <div className="form-group">
                  <label className="label">Bio</label>
                  {editingExtended ? (
                    <textarea
                      className="form-control"
                      rows={4}
                      value={extendedForm.bio}
                      onChange={e => setExtendedForm(f => ({ ...f, bio: e.target.value }))}
                    />
                  ) : (
                    <p className="profile-email">
                      {extendedProfile?.bio || <em>Not set yet.</em>}
                    </p>
                  )}
                </div>
                <div className="form-group">
                  <label className="label">Favorite cuisines</label>
                  {editingExtended ? (
                    <input
                      type="text"
                      className="form-control"
                      placeholder="italian, thai, pakistani"
                      value={extendedForm.favorite_cuisines}
                      onChange={e => setExtendedForm(f => ({ ...f, favorite_cuisines: e.target.value }))}
                    />
                  ) : (
                    <div className="tag-list">
                      {(extendedProfile?.favorite_cuisines || []).length === 0 ? (
                        <p className="empty-state-sm">None added yet.</p>
                      ) : (
                        extendedProfile.favorite_cuisines.map(cuisine => (
                          <span key={cuisine} className="tag-pill sm">{cuisine}</span>
                        ))
                      )}
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label className="label">Reviews written</label>
                  <p className="stat-value">{extendedProfile?.review_count ?? reviewsWritten}</p>
                </div>
              </>
            )}

            {profile?.role === 'admin' && (
              <p className="profile-email">Admin accounts use the admin panel for platform management.</p>
            )}

            {(isUser || isReviewer) && !editingExtended && (
              <button className="btn btn-outline btn-sm" onClick={() => setEditingExtended(true)}>
                Edit details
              </button>
            )}

            {editingExtended && (isUser || isReviewer) && (
              <form onSubmit={handleSaveExtended} className="edit-profile-form">
                {saveError && <div className="alert alert-error">{saveError}</div>}
                <div className="btn-row">
                  <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                    {saving ? 'Saving...' : 'Save details'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => setEditingExtended(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
            {saveMsg && editingExtended === false && editing === false && (
              <p className="success-text">{saveMsg}</p>
            )}
          </div>

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
