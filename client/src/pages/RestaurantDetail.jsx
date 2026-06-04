import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getRestaurant, getDishes, bookmarkRestaurant, deleteRestaurant } from '../api/restaurants'
import { getMyRestaurant } from '../api/users'
import { getReviews, createReview } from '../api/reviews'
import { useAuth } from '../context/AuthContext'
import { isAdmin, isOwner } from '../utils/permissions'
import { formatRating, formatPrice, pluralize } from '../utils/format'
import { getErrorMessage } from '../utils/errors'
import { Bookmark, MapPin } from 'lucide-react'
import StarRating from '../components/StarRating'
import ReviewCard from '../components/ReviewCard'
import Spinner from '../components/Spinner'

export default function RestaurantDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [restaurant, setRestaurant] = useState(null)
  const [dishes, setDishes] = useState([])
  const [reviews, setReviews] = useState([])
  const [avgRating, setAvgRating] = useState(0)
  const [totalReviews, setTotalReviews] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pendingApproval, setPendingApproval] = useState(false)
  const [bookmarkMsg, setBookmarkMsg] = useState('')
  const [reviewSort, setReviewSort] = useState('most_helpful')

  const [reviewForm, setReviewForm] = useState({ rating: 0, body: '', photos: '' })
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewError, setReviewError] = useState('')
  const [reviewSuccess, setReviewSuccess] = useState('')
  const [showReviewForm, setShowReviewForm] = useState(false)

  const fetchReviews = () => {
    getReviews({ restaurant_id: id, sort: reviewSort })
      .then(res => {
        setReviews(res.data.reviews || [])
        setAvgRating(res.data.avg_rating || 0)
        setTotalReviews(res.data.total_reviews || 0)
      })
      .catch(() => {})
  }

  useEffect(() => {
    setLoading(true)
    setError('')
    setPendingApproval(false)

    const restaurantPromise = getRestaurant(id)
      .then(res => ({ ok: true, data: res.data }))
      .catch(() => ({ ok: false }))

    const myRestaurantPromise = user?.role === 'reviewer'
      ? getMyRestaurant().then(res => res.data).catch(() => null)
      : Promise.resolve(null)

    Promise.all([
      restaurantPromise,
      getDishes(id).catch(() => ({ data: { dishes: [] } })),
      myRestaurantPromise
    ])
      .then(([rResult, dRes, myRestaurant]) => {
        if (rResult.ok) {
          setRestaurant(rResult.data)
        } else if (
          myRestaurant &&
          String(myRestaurant.id || myRestaurant._id) === String(id)
        ) {
          setRestaurant({
            id: myRestaurant.id || myRestaurant._id,
            name: myRestaurant.name,
            description: myRestaurant.description,
            cuisine_type: myRestaurant.cuisine_type,
            price_range: myRestaurant.price_range,
            address: myRestaurant.address,
            avg_rating: myRestaurant.avg_rating,
            thumbnail: myRestaurant.thumbnail,
            status: myRestaurant.status,
            owner_id: user?.id || user?._id,
            tags: []
          })
          setPendingApproval(myRestaurant.status === 'pending')
        } else {
          setError('Restaurant not found.')
        }
        setDishes(dRes.data?.dishes || [])
      })
      .finally(() => setLoading(false))
  }, [id, user?.id, user?.role])

  useEffect(() => {
    fetchReviews()
  }, [id, reviewSort])

  const handleBookmark = async () => {
    if (!user) return navigate('/login')
    setBookmarkMsg('')
    try {
      await bookmarkRestaurant(id)
      setBookmarkMsg('Bookmarked!')
    } catch (err) {
      setBookmarkMsg(getErrorMessage(err, 'Could not bookmark.'))
    }
  }

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${restaurant?.name}"? This cannot be undone.`)) return
    try {
      await deleteRestaurant(id)
      navigate('/restaurants')
    } catch (err) {
      alert(getErrorMessage(err, 'Could not delete restaurant.'))
    }
  }

  const handleReviewSubmit = async e => {
    e.preventDefault()
    if (!reviewForm.rating) return setReviewError('Please select a rating.')
    setSubmittingReview(true)
    setReviewError('')
    setReviewSuccess('')
    try {
      const reviewPayload = { restaurant_id: id, rating: reviewForm.rating, body: reviewForm.body }
      if (reviewForm.photos.trim()) {
        reviewPayload.photos = reviewForm.photos.split(',').map(u => u.trim()).filter(Boolean)
      }
      await createReview(reviewPayload)
      setReviewSuccess('Review submitted!')
      setReviewForm({ rating: 0, body: '', photos: '' })
      setShowReviewForm(false)
      fetchReviews()
    } catch (err) {
      setReviewError(getErrorMessage(err, 'Could not submit review.'))
    } finally {
      setSubmittingReview(false)
    }
  }

  if (loading) return <div className="page-center"><Spinner /></div>
  if (error) return (
    <div className="container">
      <div className="alert alert-error">{error}</div>
    </div>
  )
  if (!restaurant) return null

  const userIsAdmin = isAdmin(user)
  const userIsOwner = isOwner(user, restaurant)
  const showPendingBanner = restaurant.status === 'pending' && userIsOwner

  return (
    <div className="container restaurant-detail">
      {(pendingApproval || showPendingBanner) && (
        <div className="alert alert-success">
          Your restaurant is pending admin approval and is not yet publicly visible.
        </div>
      )}
      <div className="restaurant-hero">
        {restaurant.thumbnail && (
          <img src={restaurant.thumbnail} alt={restaurant.name} className="restaurant-hero-img" />
        )}
        <div className="restaurant-hero-body">
          <div className="restaurant-title-row">
            <h1>{restaurant.name}</h1>
            <div className="restaurant-badges">
              {restaurant.price_range && <span className="price-badge lg">{restaurant.price_range}</span>}
              {restaurant.cuisine_type && <span className="cuisine-badge">{restaurant.cuisine_type}</span>}
            </div>
          </div>
          <div className="restaurant-rating-row">
            <StarRating value={Math.round(avgRating)} size="lg" />
            <span className="rating-number lg">{formatRating(avgRating)}</span>
            <span className="review-count">({pluralize(totalReviews, 'review')})</span>
          </div>
          {restaurant.address && (
            <p className="restaurant-address">
              <MapPin size={16} aria-hidden /> {restaurant.address}
            </p>
          )}
          {restaurant.description && <p className="restaurant-description">{restaurant.description}</p>}
          {restaurant.tags?.length > 0 && (
            <div className="tag-list">
              {restaurant.tags.map(tag => <span key={tag} className="tag-pill sm">{tag}</span>)}
            </div>
          )}
          <div className="restaurant-action-row">
            <button onClick={handleBookmark} className="btn btn-outline">
              <Bookmark size={16} aria-hidden /> {bookmarkMsg || 'Bookmark'}
            </button>
            {(userIsAdmin || userIsOwner) && (
              <button onClick={handleDelete} className="btn btn-danger btn-sm">Delete Restaurant</button>
            )}
          </div>
        </div>
      </div>

      {/* Dishes */}
      <section className="detail-section">
        <h2 className="detail-section-title">Menu Items</h2>
        {dishes.length === 0 ? (
          <p className="empty-state">No menu items listed yet.</p>
        ) : (
          <div className="dishes-grid">
            {dishes.map(dish => (
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
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Reviews */}
      <section className="detail-section">
        <div className="section-header">
          <h2 className="detail-section-title">Reviews</h2>
          <div className="review-controls">
            <select
              className="form-control form-control-sm"
              value={reviewSort}
              onChange={e => setReviewSort(e.target.value)}
            >
              <option value="most_helpful">Most Helpful</option>
              <option value="newest">Newest</option>
              <option value="highest_rated">Highest Rated</option>
            </select>
            {user && !showReviewForm && (
              <button className="btn btn-primary btn-sm" onClick={() => setShowReviewForm(true)}>
                + Write a Review
              </button>
            )}
          </div>
        </div>

        {showReviewForm && (
          <div className="review-form-card">
            <h3>Your Review</h3>
            {reviewError && <div className="alert alert-error">{reviewError}</div>}
            {reviewSuccess && <div className="alert alert-success">{reviewSuccess}</div>}
            <form onSubmit={handleReviewSubmit}>
              <div className="form-group">
                <label className="label">Rating *</label>
                <StarRating value={reviewForm.rating} onChange={r => setReviewForm(f => ({ ...f, rating: r }))} size="lg" />
              </div>
              <div className="form-group">
                <label className="label">Your thoughts</label>
                <textarea
                  className="form-control"
                  rows={4}
                  placeholder="What did you think? Describe the food, service, ambiance..."
                  value={reviewForm.body}
                  onChange={e => setReviewForm(f => ({ ...f, body: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="label">Photo URLs <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optional — comma-separated)</span></label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="https://example.com/photo1.jpg, https://example.com/photo2.jpg"
                  value={reviewForm.photos}
                  onChange={e => setReviewForm(f => ({ ...f, photos: e.target.value }))}
                />
              </div>
              <div className="btn-row">
                <button type="submit" className="btn btn-primary" disabled={submittingReview}>
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
                <button type="button" className="btn btn-outline" onClick={() => setShowReviewForm(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {reviews.length === 0 ? (
          <div className="empty-state">
            <p>No reviews yet. Be the first to review!</p>
            {user && !showReviewForm && (
              <button className="btn btn-primary btn-sm" onClick={() => setShowReviewForm(true)}>
                Write First Review
              </button>
            )}
          </div>
        ) : (
          <div className="review-list">
            {reviews.map(review => (
              <ReviewCard
                key={review.id || review._id}
                review={review}
                onUpdated={fetchReviews}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
