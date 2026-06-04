import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { getMyRestaurant } from '../../api/users'
import { getRestaurant, updateRestaurant } from '../../api/restaurants'
import Spinner from '../../components/Spinner'
import { getErrorMessage } from '../../utils/errors'

const emptyForm = () => ({
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

export default function EditRestaurant() {
  const navigate = useNavigate()
  const [restaurantId, setRestaurantId] = useState(null)
  const [form, setForm] = useState(emptyForm())
  const [initialForm, setInitialForm] = useState(emptyForm())
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getMyRestaurant()
      .then((res) => {
        const id = res.data.id || res.data._id
        setRestaurantId(id)
        return getRestaurant(id).then((rRes) => rRes.data)
      })
      .then((data) => {
        const next = {
          name: data.name || '',
          description: data.description || '',
          cuisine_type: data.cuisine_type || '',
          price_range: data.price_range || '',
          address: data.address || '',
          lat: data.lat != null ? String(data.lat) : '',
          lng: data.lng != null ? String(data.lng) : '',
          thumbnail: data.thumbnail || '',
          phone: '',
          website: '',
        }
        setForm(next)
        setInitialForm(next)
      })
      .catch((err) => {
        if (err.response?.status === 404) {
          navigate('/restaurants/new', { replace: true })
        } else {
          setError(getErrorMessage(err, 'Failed to load your restaurant.'))
        }
      })
      .finally(() => setLoading(false))
  }, [navigate])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const buildChangedPayload = () => {
    const payload = {}
    const textFields = ['name', 'description', 'cuisine_type', 'price_range', 'address', 'thumbnail']
    textFields.forEach((key) => {
      const current = String(form[key] || '').trim()
      const initial = String(initialForm[key] || '').trim()
      if (current !== initial) payload[key] = current
    })

    const latChanged = String(form.lat || '') !== String(initialForm.lat || '')
    const lngChanged = String(form.lng || '') !== String(initialForm.lng || '')
    if (latChanged || lngChanged) {
      const lng = form.lng !== '' ? Number(form.lng) : 0
      const lat = form.lat !== '' ? Number(form.lat) : 0
      payload.location = {
        type: 'Point',
        coordinates: [Number.isFinite(lng) ? lng : 0, Number.isFinite(lat) ? lat : 0]
      }
    }

    return payload
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!restaurantId) return
    if (!form.name.trim()) return setError('Restaurant name is required.')

    const payload = buildChangedPayload()
    if (Object.keys(payload).length === 0) {
      navigate('/dashboard/reviewer', { state: { success: 'No changes to save.' } })
      return
    }

    setSubmitting(true)
    setError('')
    try {
      await updateRestaurant(restaurantId, payload)
      navigate('/dashboard/reviewer', { state: { success: 'Restaurant listing updated.' } })
    } catch (err) {
      setError(getErrorMessage(err, 'Could not update restaurant.'))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="page-center"><Spinner /></div>

  return (
    <div className="container page-layout">
      <div className="page-top">
        <div>
          <h1 className="page-title">Edit Restaurant Listing</h1>
          <p className="page-subtitle">Update your restaurant details</p>
        </div>
        <Link to="/dashboard/reviewer" className="btn btn-outline">← Back</Link>
      </div>

      <div className="create-restaurant-layout">
        <div className="card create-restaurant-form-card">
          {error && <div className="alert alert-error">{error}</div>}

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
                    onError={(e) => { e.target.style.display = 'none' }}
                  />
                </div>
              )}
            </div>

            <div className="btn-row" style={{ marginTop: '8px' }}>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
              <Link to="/dashboard/reviewer" className="btn btn-outline">Cancel</Link>
            </div>
          </form>
        </div>

        <aside className="create-restaurant-tips card">
          <h3 className="filter-title">Editing tips</h3>
          <ul className="tips-list">
            <li>Keep your description up to date</li>
            <li>Verify your address and coordinates</li>
            <li>Update your thumbnail when your branding changes</li>
          </ul>
        </aside>
      </div>
    </div>
  )
}
