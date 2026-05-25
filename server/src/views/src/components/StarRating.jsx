import { useState } from 'react'

export default function StarRating({ value = 0, onChange, size = 'md' }) {
  const [hovered, setHovered] = useState(0)
  const interactive = Boolean(onChange)

  return (
    <span className={`star-rating star-rating-${size}`}>
      {[1, 2, 3, 4, 5].map(star => (
        <span
          key={star}
          className={`star ${(hovered || value) >= star ? 'star-filled' : 'star-empty'}`}
          onClick={() => interactive && onChange(star)}
          onMouseEnter={() => interactive && setHovered(star)}
          onMouseLeave={() => interactive && setHovered(0)}
          style={{ cursor: interactive ? 'pointer' : 'default' }}
        >
          ★
        </span>
      ))}
    </span>
  )
}
