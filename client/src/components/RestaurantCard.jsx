import { Link } from 'react-router-dom'
import { MapPin, UtensilsCrossed } from 'lucide-react'
import StarRating from './StarRating'

export default function RestaurantCard({ restaurant, distanceKm }) {
  const { id, _id, name, cuisine_type, price_range, avg_rating, address, thumbnail } = restaurant
  const rid = id || _id

  return (
    <Link to={`/restaurants/${rid}`} className="restaurant-card">
      <div className="restaurant-card-img">
        {thumbnail
          ? <img src={thumbnail} alt={name} />
          : <div className="restaurant-card-placeholder"><UtensilsCrossed size={32} aria-hidden /></div>
        }
        {price_range && <span className="price-badge">{price_range}</span>}
        {distanceKm != null && (
          <span className="price-badge" style={{ left: '8px', right: 'auto', background: 'rgba(0,0,0,0.65)' }}>
            <MapPin size={14} aria-hidden /> {Number(distanceKm).toFixed(1)} km
          </span>
        )}
      </div>
      <div className="restaurant-card-body">
        <h3 className="restaurant-card-name">{name}</h3>
        {cuisine_type && <span className="cuisine-badge">{cuisine_type}</span>}
        <div className="restaurant-card-rating">
          <StarRating value={Math.round(avg_rating || 0)} size="sm" />
          <span className="rating-number">{avg_rating ? Number(avg_rating).toFixed(1) : '–'}</span>
        </div>
        {address && (
          <p className="restaurant-card-address">
            <MapPin size={14} aria-hidden /> {address}
          </p>
        )}
      </div>
    </Link>
  )
}
