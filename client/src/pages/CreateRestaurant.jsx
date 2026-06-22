import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { createRestaurant } from '../api/restaurants'
import { useAuth } from '../context/AuthContext'

export default function CreateRestaurant() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: '',
    description: '',
    cuisine_type: '',
    price_range: '',
    address: '',
    lat: '',
    lng: '',
    thumbnail: '',
    phone: '',
    website: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const canCreate = user && (user.role === 'reviewer' || user.role === 'admin')

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.name.trim()) return setError('Restaurant name is required.')
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const payload = {}
      Object.keys(form).forEach(key => {
        if (String(form[key]).trim()) payload[key] = String(form[key]).trim()
      })
      const lng = payload.lng != null ? Number(payload.lng) : 0
      const lat = payload.lat != null ? Number(payload.lat) : 0
      delete payload.lng
      delete payload.lat
      payload.location = {
        type: 'Point',
        coordinates: [Number.isFinite(lng) ? lng : 0, Number.isFinite(lat) ? lat : 0]
      }
      const res = await createRestaurant(payload)
      const newId = res.data?.restaurant?.id || res.data?.restaurant?._id || res.data?.id
      setSuccess('Restaurant created successfully!')
      if (newId) navigate(`/restaurants/${newId}`)
      else navigate('/restaurants')
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Could not create restaurant. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!canCreate) {
    return (
      <div className="container page-layout">
        <div className="alert alert-error">
          You need a Reviewer or Admin account to add restaurants.{' '}
          <Link to="/register">Create one here</Link>.
        </div>
      </div>
    )
  }

  return (
    <div className="container page-layout">
      <div className="page-top">
        <div>
          <h1 className="page-title">Add Restaurant</h1>
          <p className="page-subtitle">Share a great place to eat with the community</p>
        </div>
        <Link to="/restaurants" className="btn btn-outline">← Back</Link>
      </div>

      <div className="create-restaurant-layout">
        <div className="card create-restaurant-form-card">
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-section-title">Basic Information</div>

            <div className="form-group">
              <label className="label" htmlFor="name">Restaurant Name *</label>
              <input
                id="name"
                name="name"
                type="text"
                className="form-control"
                placeholder="e.g. The Golden Fork"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="label" htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                className="form-control"
                placeholder="Tell people what makes this restaurant special..."
                value={form.description}
                onChange={handleChange}
                rows={4}
              />
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label className="label" htmlFor="cuisine_type">Cuisine Type</label>
                <input
                  id="cuisine_type"
                  name="cuisine_type"
                  type="text"
                  className="form-control"
                  placeholder="e.g. Italian, Thai, Mexican"
                  value={form.cuisine_type}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="label" htmlFor="price_range">Price Range</label>
                <select
                  id="price_range"
                  name="price_range"
                  className="form-control"
                  value={form.price_range}
                  onChange={handleChange}
                >
                  <option value="">Select price range</option>
                  <option value="$">$ — Budget friendly</option>
                  <option value="$$">$$ — Mid-range</option>
                  <option value="$$$">$$$ — Fine dining</option>
                </select>
              </div>
            </div>

            <div className="form-section-title">Location &amp; Contact</div>

            <div className="form-group">
              <label className="label" htmlFor="address">Address</label>
              <input
                id="address"
                name="address"
                type="text"
                className="form-control"
                placeholder="e.g. 123 Main St, New York, NY 10001"
                value={form.address}
                onChange={handleChange}
              />
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label className="label" htmlFor="lat">Latitude <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optional)</span></label>
                <input
                  id="lat"
                  name="lat"
                  type="number"
                  step="any"
                  min="-90"
                  max="90"
                  className="form-control"
                  placeholder="e.g. 40.7128"
                  value={form.lat}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label className="label" htmlFor="lng">Longitude <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optional)</span></label>
                <input
                  id="lng"
                  name="lng"
                  type="number"
                  step="any"
                  min="-180"
                  max="180"
                  className="form-control"
                  placeholder="e.g. -74.0060"
                  value={form.lng}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label className="label" htmlFor="phone">Phone Number</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  className="form-control"
                  placeholder="e.g. +1 (555) 000-0000"
                  value={form.phone}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="label" htmlFor="website">Website</label>
                <input
                  id="website"
                  name="website"
                  type="url"
                  className="form-control"
                  placeholder="https://example.com"
                  value={form.website}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-section-title">Media</div>

            <div className="form-group">
              <label className="label" htmlFor="thumbnail">Thumbnail Image URL</label>
              <input
                id="thumbnail"
                name="thumbnail"
                type="url"
                className="form-control"
                placeholder="https://example.com/image.jpg"
                value={form.thumbnail}
                onChange={handleChange}
              />
              {form.thumbnail && (
                <div className="thumbnail-preview-wrap">
                  <img
                    src={form.thumbnail}
                    alt="Thumbnail preview"
                    className="thumbnail-preview"
                    onError={e => { e.target.style.display = 'none' }}
                  />
                </div>
              )}
            </div>

            <div className="btn-row" style={{ marginTop: '8px' }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Creating...' : 'Create Restaurant'}
              </button>
              <Link to="/restaurants" className="btn btn-outline">Cancel</Link>
            </div>
          </form>
        </div>

        <aside className="create-restaurant-tips card">
          <h3 className="filter-title">Tips for a great listing</h3>
          <ul className="tips-list">
            <li>Write a clear, informative description</li>
            <li>Specify the cuisine type so users can find you</li>
            <li>Set an accurate price range</li>
            <li>Include the full address for easy navigation</li>
            <li>Add a high-quality thumbnail image</li>
            <li> Add contact details so customers can reach you</li>
          </ul>
          <div style={{ marginTop: '20px', padding: '14px', background: 'var(--primary-light)', borderRadius: 'var(--radius-sm)' }}>
            <p style={{ fontSize: '0.84rem', color: 'var(--primary-dark)', fontWeight: 500 }}>
              Your listing will be reviewed by our team before it goes live.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
