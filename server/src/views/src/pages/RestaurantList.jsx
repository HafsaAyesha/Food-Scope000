import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { getRestaurants } from '../api/restaurants'
import { getTags } from '../api/tags'
import { useAuth } from '../context/AuthContext'
import { canCreateRestaurant } from '../utils/permissions'
import { getErrorMessage } from '../utils/errors'
import { pluralize } from '../utils/format'
import RestaurantCard from '../components/RestaurantCard'
import Spinner from '../components/Spinner'

export default function RestaurantList() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [restaurants, setRestaurants] = useState([])
  const [tags, setTags] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [filters, setFilters] = useState({
    cuisine: searchParams.get('cuisine') || '',
    price_range: searchParams.get('price_range') || '',
    min_rating: searchParams.get('min_rating') || '',
    tag: searchParams.get('tag') || '',
  })
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1)
  const limit = 12

  useEffect(() => {
    getTags()
      .then(res => setTags(res.data.tags || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    setError('')
    const params = { page, limit }
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
  }, [filters, page])

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

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="container page-layout">
      <div className="page-top">
        <div>
          <h1 className="page-title">Restaurants</h1>
          <p className="page-subtitle">{pluralize(total, 'restaurant')} found</p>
        </div>
        {canCreateRestaurant(user) && (
          <Link to="/restaurants/new" className="btn btn-primary">+ Add Restaurant</Link>
        )}
      </div>

      <div className="list-layout">
        {/* Filters sidebar */}
        <aside className="filter-panel">
          <h3 className="filter-title">Filters</h3>
          <form onSubmit={applyFilters}>
            <div className="form-group">
              <label className="label">Cuisine</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Italian"
                value={filters.cuisine}
                onChange={e => setFilters({ ...filters, cuisine: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="label">Price Range</label>
              <select
                className="form-control"
                value={filters.price_range}
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
                onChange={e => setFilters({ ...filters, tag: e.target.value })}
              >
                <option value="">Any</option>
                {tags.map(tag => (
                  <option key={tag.id || tag._id} value={tag.name}>{tag.name}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn btn-primary btn-full">Apply Filters</button>
            <button type="button" className="btn btn-outline btn-full" onClick={clearFilters} style={{ marginTop: '8px' }}>
              Clear All
            </button>
          </form>
        </aside>

        {/* Restaurant grid */}
        <div className="list-content">
          {loading ? (
            <div className="center-spinner"><Spinner /></div>
          ) : error ? (
            <div className="alert alert-error">{error}</div>
          ) : restaurants.length === 0 ? (
            <div className="empty-state">
              <p>No restaurants match your filters.</p>
              <button className="btn btn-outline btn-sm" onClick={clearFilters}>Clear filters</button>
            </div>
          ) : (
            <>
              <div className="restaurants-grid">
                {restaurants.map(r => <RestaurantCard key={r.id || r._id} restaurant={r} />)}
              </div>
              {totalPages > 1 && (
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
