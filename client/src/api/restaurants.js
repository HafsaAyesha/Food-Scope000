import client from './client'

export const getRestaurants = params => client.get('/restaurants', { params })
export const getRestaurant = id => client.get(`/restaurants/${id}`)
export const createRestaurant = data => client.post('/restaurants', data)
export const updateRestaurant = (id, data) => client.put(`/restaurants/${id}`, data)
export const deleteRestaurant = id => client.delete(`/restaurants/${id}`)
export const bookmarkRestaurant = id => client.post(`/restaurants/${id}/bookmark`)

export const getDishes = restaurantId => client.get(`/restaurants/${restaurantId}/dishes`)
export const createDish = (restaurantId, data) => client.post(`/restaurants/${restaurantId}/dishes`, data)
export const updateDish = (restaurantId, dishId, data) => client.put(`/restaurants/${restaurantId}/dishes/${dishId}`, data)
export const deleteDish = (restaurantId, dishId) => client.delete(`/restaurants/${restaurantId}/dishes/${dishId}`)
