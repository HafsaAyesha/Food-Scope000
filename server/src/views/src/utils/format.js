export const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export const formatRating = (rating) => {
  if (rating == null || rating === 0) return '–'
  return Number(rating).toFixed(1)
}

export const formatPrice = (price) => {
  if (price == null) return ''
  return `$${Number(price).toFixed(2)}`
}

export const pluralize = (count, singular, plural) => {
  const word = count === 1 ? singular : (plural ?? `${singular}s`)
  return `${count} ${word}`
}
