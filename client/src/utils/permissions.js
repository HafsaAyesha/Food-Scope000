export const isAdmin = (user) => user?.role === 'admin'

export const isReviewer = (user) => user?.role === 'reviewer' || user?.role === 'admin'

export const canCreateRestaurant = (user) => isReviewer(user)

export const isOwner = (user, resource) => {
  if (!user || !resource) return false
  const userId = String(user.id || user._id || '')
  const ownerId = String(
    resource.owner_id ||
    resource.user_id ||
    resource.user?.id ||
    resource.user?._id ||
    ''
  )
  return userId !== '' && userId === ownerId
}

export const canModerate = (user, resource) => isAdmin(user) || isOwner(user, resource)
