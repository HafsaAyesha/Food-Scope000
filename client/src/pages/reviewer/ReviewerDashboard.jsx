import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { UtensilsCrossed, PenLine } from 'lucide-react'
import { getMyRestaurant, getMyRestaurantReviews } from '../../api/users'
import ReviewCard from '../../components/ReviewCard'
import StarRating from '../../components/StarRating'
import Spinner from '../../components/Spinner'
import { formatRating } from '../../utils/format'
import { getErrorMessage } from '../../utils/errors'

export default function ReviewerDashboard() {
  const location = useLocation()
  const [restaurant, setRestaurant] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(location.state?.success || '')

  const loadData = () => {
    setLoading(true)
    setError('')
    Promise.all([
      getMyRestaurant(),
      getMyRestaurantReviews({ limit: 10 })
    ])
      .then(([rRes, revRes]) => {
        setRestaurant(rRes.data)
        setReviews(revRes.data.reviews || [])
      })
      .catch((err) => {
        setRestaurant(null)
        setReviews([])
        setError(getErrorMessage(err, 'Failed to load reviewer dashboard.'))
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
  }, [])

  if (loading) return <div className="page-center"><Spinner /></div>

  const restaurantId = restaurant?.id || restaurant?._id

  return (
    <div className="container page-layout">
      <div className="page-top">
        <div>
          <h1 className="page-title">Reviewer Dashboard</h1>
          <p className="page-subtitle">Manage your listing and see what diners are saying</p>
        </div>
      </div>

      {success && <div className="alert alert-success">{success}</div>}

      {error && !restaurant && (
        <div className="card create-restaurant-form-card">
          <div className="alert alert-error">{error}</div>
          <p className="empty-state-sm">You have not created a restaurant yet.</p>
          <Link to="/restaurants/new" className="btn btn-primary btn-sm">
            Create your restaurant
          </Link>
        </div>
      )}

      {restaurant && (
        <>
          <div className="card create-restaurant-form-card">
            <h2 className="section-title">{restaurant.name}</h2>
            <p className="profile-email">
              {restaurant.cuisine_type} · {restaurant.price_range}
              {restaurant.status && (
                <span className={`badge badge-reviewer`}> {restaurant.status}</span>
              )}
            </p>
            <div className="profile-stats">
              <div className="profile-stat">
                <span className="stat-value">{restaurant.total_reviews ?? 0}</span>
                <span className="stat-label">Reviews</span>
              </div>
              <div className="profile-stat">
                <StarRating value={Math.round(restaurant.avg_rating || 0)} size="sm" />
                <span className="stat-value">{formatRating(restaurant.avg_rating)}</span>
                <span className="stat-label">Avg rating</span>
              </div>
            </div>
            {restaurantId && (
              <div className="btn-row">
                <Link to="/dashboard/reviewer/edit" className="btn btn-primary btn-sm">
                  <PenLine size={16} aria-hidden /> Edit Listing
                </Link>
                <Link to="/dashboard/reviewer/menu" className="btn btn-outline btn-sm">
                  <UtensilsCrossed size={16} aria-hidden /> Manage Menu
                </Link>
                <Link to={`/restaurants/${restaurantId}`} className="btn btn-outline btn-sm">
                  View listing
                </Link>
              </div>
            )}
          </div>

          <section className="detail-section">
            <h2 className="section-title">Recent reviews</h2>
            {reviews.length === 0 ? (
              <p className="empty-state-sm">No reviews yet.</p>
            ) : (
              <div className="review-list">
                {reviews.map((review) => (
                  <ReviewCard
                    key={review.id || review._id}
                    review={review}
                    onUpdated={loadData}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
