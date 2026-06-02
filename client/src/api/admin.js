import client from './client'

export const getAdminUsers = params => client.get('/admin/users', { params })
export const updateRestaurantStatus = (id, data) => client.patch(`/admin/restaurants/${id}/status`, data)
export const moderateReview = (id, data) => client.patch(`/admin/reviews/${id}/moderate`, data)
export const getAnalytics = () => client.get('/admin/analytics')
