import client from './client'

export const getProfile = () => client.get('/users/me')
export const updateProfile = data => client.put('/users/me', data)
export const getBookmarks = params => client.get('/users/me/bookmarks', { params })
export const getNotifications = params => client.get('/users/me/notifications', { params })
export const getMyRestaurant = () => client.get('/users/me/restaurant')
export const getMyRestaurantReviews = params => client.get('/users/me/restaurant/reviews', { params })
export const getMeProfile = () => client.get('/users/me/profile')
export const updateMeProfile = data => client.put('/users/me/profile', data)
