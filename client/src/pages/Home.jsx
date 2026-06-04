import { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { MapPin, Star } from 'lucide-react'
import { getRestaurants } from '../api/restaurants'
import { getTags } from '../api/tags'
import { getNearby, getIpLocation, resolveLocation } from '../api/geo'
import { useGeolocation } from '../hooks/useGeolocation'
import RestaurantCard from '../components/RestaurantCard'
import Spinner from '../components/Spinner'

const DEFAULT_RADIUS_KM = 5
const DEFAULT_LIMIT = 12

export default function Home() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [featured, setFeatured] = useState([])
  const [tags, setTags] = useState([])
  const [nearby, setNearby] = useState([])
  const [nearbyTotal, setNearbyTotal] = useState(0)
  const [clusterSummary, setClusterSummary] = useState([])
  const [nearbyError, setNearbyError] = useState('')
  const [loadingFeatured, setLoadingFeatured] = useState(true)
  const [loadingTags, setLoadingTags] = useState(true)
  const [loadingNearby, setLoadingNearby] = useState(false)
  const [manualQuery, setManualQuery] = useState('')
  const [manualResults, setManualResults] = useState([])
  const [manualError, setManualError] = useState('')
  const [loadingManual, setLoadingManual] = useState(false)
  const [ipFallback, setIpFallback] = useState(null)
  const [loadingIpFallback, setLoadingIpFallback] = useState(false)

  const {
    status: geoStatus,
    position,
    error: geoError,
    message: geoMessage,
    source: geoSource,
    requestLocation,
    retry,
    setManualLocation,
    clearLocation
  } = useGeolocation()

  useEffect(() => {
    getRestaurants({ limit: 6 })
      .then((res) => setFeatured(res.data.restaurants || []))
      .catch(() => setFeatured([]))
      .finally(() => setLoadingFeatured(false))

    getTags()
      .then((res) => setTags((res.data.tags || []).slice(0, 16)))
      .catch(() => setTags([]))
      .finally(() => setLoadingTags(false))
  }, [])

  const loadNearby = useCallback(async (coords) => {
    setLoadingNearby(true)
    setNearbyError('')
    try {
      const response = await getNearby({
        lat: coords.lat,
        lng: coords.lng,
        radius: DEFAULT_RADIUS_KM,
        limit: DEFAULT_LIMIT,
        page: 1,
        cluster: true
      })
      const data = response.data?.data
      if (!data) {
        throw new Error('Invalid nearby response')
      }
      setNearby(data.restaurants || [])
      setNearbyTotal(data.total || 0)
      setClusterSummary(data.clusters || [])
    } catch (err) {
      setNearbyError(err.apiError?.message || 'Could not load nearby restaurants. Please try again.')
      setNearby([])
      setNearbyTotal(0)
      setClusterSummary([])
    } finally {
      setLoadingNearby(false)
    }
  }, [])

  useEffect(() => {
    if ((geoStatus === 'success' || geoStatus === 'fallback') && position) {
      loadNearby(position)
    }
  }, [geoStatus, position, loadNearby])

  useEffect(() => {
    if (geoStatus === 'denied' || geoStatus === 'unavailable') {
      if (ipFallback || loadingIpFallback) return
      setLoadingIpFallback(true)
      getIpLocation()
        .then((res) => {
          const location = res.data?.data?.location
          if (location) {
            setIpFallback(location)
            loadNearby(location)
          }
        })
        .catch(() => {
          // IP fallback is optional; still allow manual fallback.
        })
        .finally(() => setLoadingIpFallback(false))
    }
  }, [geoStatus, ipFallback, loadingIpFallback, loadNearby])

  const searchManualLocation = async () => {
    if (!manualQuery.trim()) return
    setLoadingManual(true)
    setManualError('')
    try {
      const response = await resolveLocation(manualQuery.trim())
      setManualResults(response.data?.data?.locations || [])
    } catch (err) {
      setManualResults([])
      setManualError(err.apiError?.message || 'Could not resolve that location. Please try another city or region.')
    } finally {
      setLoadingManual(false)
    }
  }

  const selectManualLocation = (location) => {
    setManualResults([])
    setManualQuery(location.label)
    setManualLocation({ lat: location.lat, lng: location.lng, label: location.label })
    loadNearby({ lat: location.lat, lng: location.lng })
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`)
  }

  const renderGeoBanner = () => {
    if (geoStatus === 'idle') {
      return 'Allow location access to see restaurants near you.'
    }
    if (geoStatus === 'loading') {
      return geoMessage || 'Fetching your location…'
    }
    if (geoStatus === 'success') {
      return geoSource === 'cache'
        ? 'Using cached location to save battery.'
        : 'Showing restaurants based on your current location.'
    }
    if (geoStatus === 'denied') {
      return geoError?.message || 'Location permission denied. Use IP fallback or manual city selection.'
    }
    if (geoStatus === 'unavailable') {
      return geoError?.message || 'Location unavailable. Use manual fallback to search by city.'
    }
    return geoError?.message || 'Could not get your location.'
  }

  return (
    <div className="home-page">
      {/* Hero */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">Discover amazing food<br />near you</h1>
          <p className="hero-subtitle">Find, review, and explore the best restaurants in your city</p>
          <form onSubmit={handleSearch} className="hero-search">
            <input
              type="text"
              className="hero-input"
              placeholder="Search for restaurants, cuisines, or dishes..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="submit" className="btn btn-primary">Search</button>
          </form>
          <div className="hero-cta">
            <Link to="/restaurants" className="btn btn-outline">Browse All Restaurants</Link>
          </div>
        </div>
      </section>

      <div className="container">
        {/* Tags */}
        <section className="home-section">
          <div className="section-header">
            <h2>Browse by Category</h2>
            <Link to="/restaurants" className="see-all">See all →</Link>
          </div>
          {loadingTags ? (
            <div className="center-spinner"><Spinner /></div>
          ) : tags.length === 0 ? (
            <p className="empty-state">No categories yet.</p>
          ) : (
            <div className="tags-grid">
              {tags.map((tag) => (
                <Link
                  key={tag.id || tag._id}
                  to={`/restaurants?tag=${encodeURIComponent(tag.name)}`}
                  className="tag-pill"
                >
                  {tag.name}
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Featured Restaurants */}
        <section className="home-section">
          <div className="section-header">
            <h2>Top Rated Restaurants</h2>
            <Link to="/restaurants" className="see-all">See all →</Link>
          </div>
          {loadingFeatured ? (
            <div className="center-spinner"><Spinner /></div>
          ) : featured.length === 0 ? (
            <div className="empty-state">
              <p>No restaurants yet.</p>
              <Link to="/restaurants" className="btn btn-outline btn-sm">Be the first to add one</Link>
            </div>
          ) : (
            <div className="restaurants-grid">
              {featured.map((r) => <RestaurantCard key={r.id || r._id} restaurant={r} />)}
            </div>
          )}
        </section>

        {/* Nearby */}
        <section className="home-section">
          <div className="section-header">
            <h2>Restaurants Near You</h2>
          </div>
          <div className="nearby-prompt">
            <p>{renderGeoBanner()}</p>
            {(geoStatus === 'idle' || geoStatus === 'denied' || geoStatus === 'unavailable') && (
              <div className="nearby-actions">
                <button type="button" className="btn btn-primary" onClick={requestLocation}>
                  {geoStatus === 'idle' ? 'Find Nearby' : 'Retry Location'}
                </button>
                {geoStatus !== 'idle' && geoStatus !== 'loading' && (
                  <button type="button" className="btn btn-outline btn-sm" onClick={retry} disabled={!geoError?.retryable}>
                    Retry with backoff
                  </button>
                )}
              </div>
            )}
            {(geoStatus === 'success' || geoStatus === 'fallback') && (
              <div className="nearby-actions">
                <button type="button" className="btn btn-outline btn-sm" onClick={() => { clearLocation(); requestLocation() }}>
                  Refresh Location
                </button>
              </div>
            )}
          </div>

          {loadingIpFallback && <div className="center-spinner"><Spinner /></div>}
          {ipFallback && !loadingNearby && (
            <div className="alert alert-info">
              Using approximate location from your IP: {ipFallback.city || ipFallback.region || 'approximate location'}.
            </div>
          )}

          {(geoStatus === 'denied' || geoStatus === 'unavailable') && (
            <div className="manual-location-panel">
              <label htmlFor="manual-location-input">Enter a city or region</label>
              <div className="manual-location-row">
                <input
                  id="manual-location-input"
                  type="text"
                  value={manualQuery}
                  onChange={(e) => setManualQuery(e.target.value)}
                  placeholder="Paris, San Francisco, Berlin..."
                />
                <button type="button" className="btn btn-outline" onClick={searchManualLocation}>
                  Search
                </button>
              </div>
              {loadingManual && <div className="center-spinner"><Spinner /></div>}
              {manualError && <div className="alert alert-error">{manualError}</div>}
              {manualResults.length > 0 && (
                <div className="manual-results">
                  {manualResults.map((location) => (
                    <button
                      key={`${location.lat}-${location.lng}-${location.label}`}
                      type="button"
                      className="btn btn-link"
                      onClick={() => selectManualLocation(location)}
                    >
                      {location.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {(geoStatus === 'loading' || loadingNearby) && <div className="center-spinner"><Spinner /></div>}

          {nearbyError && !loadingNearby && (
            <div className="nearby-prompt">
              <div className="alert alert-error">{nearbyError}</div>
            </div>
          )}

          {(geoStatus === 'success' || geoStatus === 'fallback') && nearby.length > 0 && (
            <div className="cluster-summary">
              Showing {nearbyTotal} restaurants near your location across {clusterSummary.length} hotspot{clusterSummary.length === 1 ? '' : 's'}.
            </div>
          )}

          {(geoStatus === 'success' || geoStatus === 'fallback') && !loadingNearby && nearby.length === 0 && (
            <p className="empty-state">No restaurants found within {DEFAULT_RADIUS_KM} km.</p>
          )}

          {(geoStatus === 'success' || geoStatus === 'fallback') && !loadingNearby && nearby.length > 0 && (
            <div className="restaurants-grid">
              {nearby.map((r) => (
                <Link key={r.id || r._id} to={`/restaurants/${r.id || r._id}`} className="restaurant-card">
                  <div className="restaurant-card-body">
                    <h3 className="restaurant-card-name">{r.name}</h3>
                    <p className="restaurant-card-address">
                      <MapPin size={14} aria-hidden /> {r.distance_km} km away · <Star size={14} aria-hidden /> {r.avg_rating}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
