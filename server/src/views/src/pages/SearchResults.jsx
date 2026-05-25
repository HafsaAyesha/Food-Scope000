import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { search } from '../api/search'
import { formatPrice, pluralize } from '../utils/format'
import { getErrorMessage } from '../utils/errors'
import RestaurantCard from '../components/RestaurantCard'
import StarRating from '../components/StarRating'
import Spinner from '../components/Spinner'

export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [type, setType] = useState(searchParams.get('type') || 'all')
  const [cuisine, setCuisine] = useState(searchParams.get('cuisine') || '')
  const [minRating, setMinRating] = useState(searchParams.get('min_rating') || '')
  const [maxPrice, setMaxPrice] = useState(searchParams.get('max_price') || '')

  const [results, setResults] = useState({ restaurants: [], dishes: [] })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)

  const doSearch = (q, t, c, r, p) => {
    if (!q || q.trim().length < 2) {
      setError('Please enter at least 2 characters.')
      return
    }
    setLoading(true)
    setError('')
    setSearched(true)
    const params = { q: q.trim(), type: t }
    if (c) params.cuisine = c
    if (r) params.min_rating = r
    if (p) params.max_price = p
    setSearchParams(params)

    search(params)
      .then(res => setResults({ restaurants: res.data.restaurants || [], dishes: res.data.dishes || [] }))
      .catch(err => setError(getErrorMessage(err, 'Search failed.')))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const q = searchParams.get('q')
    if (q) doSearch(q, type, cuisine, minRating, maxPrice)
  }, [])

  const handleSubmit = e => {
    e.preventDefault()
    doSearch(query, type, cuisine, minRating, maxPrice)
  }

  const total = results.restaurants.length + results.dishes.length

  return (
    <div className="container search-page">
      <h1 className="page-title">Search</h1>

      <form onSubmit={handleSubmit} className="search-form-bar">
        <input
          type="text"
          className="form-control search-input"
          placeholder="Search restaurants, dishes, cuisines..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <button type="submit" className="btn btn-primary">Search</button>
      </form>

      <div className="search-layout">
        {/* Filters */}
        <aside className="filter-panel">
          <h3 className="filter-title">Filters</h3>
          <div className="form-group">
            <label className="label">Search In</label>
            <select className="form-control" value={type} onChange={e => setType(e.target.value)}>
              <option value="all">Everything</option>
              <option value="restaurant">Restaurants only</option>
              <option value="dish">Dishes only</option>
            </select>
          </div>
          <div className="form-group">
            <label className="label">Cuisine</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Thai"
              value={cuisine}
              onChange={e => setCuisine(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="label">Min Rating</label>
            <select className="form-control" value={minRating} onChange={e => setMinRating(e.target.value)}>
              <option value="">Any</option>
              <option value="3">3+</option>
              <option value="4">4+</option>
              <option value="5">5 only</option>
            </select>
          </div>
          <div className="form-group">
            <label className="label">Max Price</label>
            <select className="form-control" value={maxPrice} onChange={e => setMaxPrice(e.target.value)}>
              <option value="">Any</option>
              <option value="$">$ Budget</option>
              <option value="$$">$$ Mid-range</option>
              <option value="$$$">$$$ Fine dining</option>
            </select>
          </div>
          <button className="btn btn-primary btn-full" onClick={() => doSearch(query, type, cuisine, minRating, maxPrice)}>
            Apply Filters
          </button>
        </aside>

        {/* Results */}
        <div className="search-results">
          {loading && <div className="center-spinner"><Spinner /></div>}
          {error && <div className="alert alert-error">{error}</div>}

          {!loading && searched && !error && (
            <p className="results-count">{pluralize(total, 'result')} for <strong>"{searchParams.get('q')}"</strong></p>
          )}

          {!loading && !error && searched && total === 0 && (
            <div className="empty-state">
              <p>No results found. Try different keywords or filters.</p>
            </div>
          )}

          {!loading && results.restaurants.length > 0 && (type === 'all' || type === 'restaurant') && (
            <div className="results-section">
              <h2 className="results-section-title">Restaurants ({results.restaurants.length})</h2>
              <div className="restaurants-grid">
                {results.restaurants.map(r => <RestaurantCard key={r.id || r._id} restaurant={r} />)}
              </div>
            </div>
          )}

          {!loading && results.dishes.length > 0 && (type === 'all' || type === 'dish') && (
            <div className="results-section">
              <h2 className="results-section-title">Dishes ({results.dishes.length})</h2>
              <div className="dishes-grid">
                {results.dishes.map(dish => (
                  <div key={dish.id || dish._id} className="dish-card">
                    {dish.image_url && <img src={dish.image_url} alt={dish.name} className="dish-img" />}
                    <div className="dish-body">
                      <h4 className="dish-name">{dish.name}</h4>
                      {dish.description && <p className="dish-desc">{dish.description}</p>}
                      <div className="dish-footer">
                        <span className="dish-price">{formatPrice(dish.price)}</span>
                        {dish.dietary_tags?.map(tag => (
                          <span key={tag} className="tag-pill xs">{tag}</span>
                        ))}
                      </div>
                      {dish.restaurant_id && (
                        <Link to={`/restaurants/${dish.restaurant_id}`} className="btn-text">
                          View Restaurant →
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!searched && (
            <div className="search-placeholder">
              <p>🔍 Enter a search term to find restaurants and dishes</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
