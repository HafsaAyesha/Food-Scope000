import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { getRestaurants } from '../api/restaurants'
import { getNearby } from '../api/geo'
import { getTags } from '../api/tags'
import { useAuth } from '../context/AuthContext'
import { useGeolocation } from '../hooks/useGeolocation'
import { canCreateRestaurant } from '../utils/permissions'
import { getErrorMessage } from '../utils/errors'
import { pluralize } from '../utils/format'
import RestaurantCard from '../components/RestaurantCard'
import NearbyMap from '../components/NearbyMap'
import Spinner from '../components/Spinner'

const NEAR_ME_RADIUS_KM = 10
const LIMIT = 12

export default function RestaurantList() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [restaurants, setRestaurants] = useState([])
  const [tags, setTags] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [nearMeMode, setNearMeMode] = useState(false)
  const [nearMeLoading, setNearMeLoading] = useState(false)
  const [nearMeError, setNearMeError] = useState('')

  const { status: geoStatus, position, requestLocation } = useGeolocation()
  const [selectedCardId, setSelectedCardId] = useState(null)
  const cardRefs = useRef({})

  const [filters, setFilters] = useState({
    cuisine: searchParams.get('cuisine') || '',
    price_range: searchParams.get('price_range') || '',
    min_rating: searchParams.get('min_rating') || '',
    tag: searchParams.get('tag') || '',
  })
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1)

  useEffect(() => {
    getTags()
      .then(res => setTags(res.data.tags || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (nearMeMode) return
    setLoading(true)
    setError('')
    const params = { page, limit: LIMIT }
    if (filters.cuisine) params.cuisine = filters.cuisine
    if (filters.price_range) params.price_range = filters.price_range
    if (filters.min_rating) params.min_rating = filters.min_rating
    if (filters.tag) params.tag = filters.tag

    getRestaurants(params)
      .then(res => {
        setRestaurants(res.data.restaurants || [])
        setTotal(res.data.total || 0)
      })
      .catch(err => setError(getErrorMessage(err, 'Failed to load restaurants.')))
      .finally(() => setLoading(false))
  }, [filters, page, nearMeMode])

  const loadNearby = useCallback(async (coords) => {
    setNearMeLoading(true)
    setNearMeError('')
    try {
      const res = await getNearby({
        lat: coords.lat,
        lng: coords.lng,
        radius: NEAR_ME_RADIUS_KM,
        limit: 50,
        page: 1,
      })
      const data = res.data?.data
      const list = data?.restaurants || []
      setRestaurants(list)
      setTotal(list.length)
    } catch (err) {
      setNearMeError(getErrorMessage(err, 'Could not load nearby restaurants.'))
      setRestaurants([])
      setTotal(0)
    } finally {
      setNearMeLoading(false)
    }
  }, [])

  useEffect(() => {
    if (nearMeMode && (geoStatus === 'success' || geoStatus === 'fallback') && position) {
      loadNearby(position)
    }
  }, [nearMeMode, geoStatus, position, loadNearby])

  const handleSelectRestaurant = useCallback((id) => {
    setSelectedCardId(id)
    const el = cardRefs.current[id]
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    setTimeout(() => setSelectedCardId(null), 2000)
  }, [])

  const handleNearMeToggle = () => {
    if (nearMeMode) {
      setNearMeMode(false)
      setNearMeError('')
      setRestaurants([])
      setTotal(0)
      setPage(1)
      setSelectedCardId(null)
    } else {
      setNearMeMode(true)
      setNearMeError('')
      if (geoStatus === 'idle' || geoStatus === 'denied') {
        requestLocation()
      } else if ((geoStatus === 'success' || geoStatus === 'fallback') && position) {
        loadNearby(position)
      }
    }
  }

  const applyFilters = e => {
    e.preventDefault()
    setPage(1)
    const params = {}
    if (filters.cuisine) params.cuisine = filters.cuisine
    if (filters.price_range) params.price_range = filters.price_range
    if (filters.min_rating) params.min_rating = filters.min_rating
    if (filters.tag) params.tag = filters.tag
    setSearchParams(params)
  }

  const clearFilters = () => {
    setFilters({ cuisine: '', price_range: '', min_rating: '', tag: '' })
    setSearchParams({})
    setPage(1)
  }

  const totalPages = nearMeMode ? 1 : Math.ceil(total / LIMIT)

  const isLoading = nearMeMode ? (nearMeLoading || geoStatus === 'loading') : loading
  const activeError = nearMeMode ? nearMeError : error

  const geoStatusLabel = () => {
    if (geoStatus === 'loading') return 'Getting your location…'
    if (geoStatus === 'denied') return 'Location permission denied. Please allow it and try again.'
    if (geoStatus === 'error') return 'Could not get your location. Please try again.'
    if ((geoStatus === 'success' || geoStatus === 'fallback') && !nearMeLoading)
      return `Showing ${total} restaurants within ${NEAR_ME_RADIUS_KM} km of your location`
    return 'Finding restaurants near you…'
  }

  return (
    <div className="container page-layout">
      <div className="page-top">
        <div>
          <h1 className="page-title">Restaurants</h1>
          <p className="page-subtitle">
            {nearMeMode ? geoStatusLabel() : `${pluralize(total, 'restaurant')} found`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            type="button"
            className={nearMeMode ? 'btn btn-primary' : 'btn btn-outline'}
            onClick={handleNearMeToggle}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            📍 {nearMeMode ? 'Near Me (on)' : 'Near Me'}
          </button>
          {canCreateRestaurant(user) && (
            <Link to="/restaurants/new" className="btn btn-primary">+ Add Restaurant</Link>
          )}
        </div>
      </div>

      <div className="list-layout">
        {/* Filters sidebar */}
        <aside className="filter-panel">
          <h3 className="filter-title">Filters</h3>
          {nearMeMode && (
            <p style={{ fontSize: '13px', color: '#888', marginBottom: '12px' }}>
              Filters are disabled in Near Me mode.
            </p>
          )}
          <form onSubmit={applyFilters}>
            <div className="form-group">
              <label className="label">Cuisine</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Italian"
                value={filters.cuisine}
                disabled={nearMeMode}
                onChange={e => setFilters({ ...filters, cuisine: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="label">Price Range</label>
              <select
                className="form-control"
                value={filters.price_range}
                disabled={nearMeMode}
                onChange={e => setFilters({ ...filters, price_range: e.target.value })}
              >
                <option value="">Any</option>
                <option value="$">$ — Budget</option>
                <option value="$$">$$ — Mid-range</option>
                <option value="$$$">$$$ — Fine dining</option>
              </select>
            </div>
            <div className="form-group">
              <label className="label">Min Rating</label>
              <select
                className="form-control"
                value={filters.min_rating}
                disabled={nearMeMode}
                onChange={e => setFilters({ ...filters, min_rating: e.target.value })}
              >
                <option value="">Any</option>
                <option value="3">3+ Stars</option>
                <option value="4">4+ Stars</option>
                <option value="5">5 Stars</option>
              </select>
            </div>
            <div className="form-group">
              <label className="label">Tag</label>
              <select
                className="form-control"
                value={filters.tag}
                disabled={nearMeMode}
                onChange={e => setFilters({ ...filters, tag: e.target.value })}
              >
                <option value="">Any</option>
                {tags.map(tag => (
                  <option key={tag.id || tag._id} value={tag.name}>{tag.name}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={nearMeMode}>Apply Filters</button>
            <button type="button" className="btn btn-outline btn-full" onClick={clearFilters} disabled={nearMeMode} style={{ marginTop: '8px' }}>
              Clear All
            </button>
          </form>
        </aside>

        {/* Restaurant grid */}
        <div className="list-content">
          {isLoading ? (
            <div className="center-spinner"><Spinner /></div>
          ) : activeError ? (
            <div className="alert alert-error">{activeError}</div>
          ) : restaurants.length === 0 ? (
            <div className="empty-state">
              {nearMeMode
                ? <p>No restaurants found within {NEAR_ME_RADIUS_KM} km of your location.</p>
                : <p>No restaurants match your filters.</p>
              }
              {!nearMeMode && (
                <button className="btn btn-outline btn-sm" onClick={clearFilters}>Clear filters</button>
              )}
            </div>
          ) : (
            <>
              {nearMeMode && position && restaurants.length > 0 && (
                <NearbyMap
                  userPosition={position}
                  restaurants={restaurants}
                  onSelectRestaurant={handleSelectRestaurant}
                />
              )}
              <div className="restaurants-grid">
                {restaurants.map(r => {
                  const rid = r.id || r._id
                  const isHighlighted = selectedCardId === rid
                  return (
                    <div
                      key={rid}
                      ref={el => { cardRefs.current[rid] = el }}
                      style={{
                        outline: isHighlighted ? '3px solid #e67e22' : '3px solid transparent',
                        borderRadius: '12px',
                        transition: 'outline 0.3s ease',
                      }}
                    >
                      <RestaurantCard
                        restaurant={r}
                        distanceKm={nearMeMode ? r.distance_km : null}
                      />
                    </div>
                  )
                })}
              </div>
              {!nearMeMode && totalPages > 1 && (
                <div className="pagination">
                  <button
                    className="btn btn-outline btn-sm"
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                  >← Prev</button>
                  <span className="pagination-info">Page {page} of {totalPages}</span>
                  <button
                    className="btn btn-outline btn-sm"
                    disabled={page === totalPages}
                    onClick={() => setPage(p => p + 1)}
                  >Next →</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
