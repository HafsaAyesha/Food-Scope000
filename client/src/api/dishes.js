import client from './client'

export const getDishes = (restaurantId) => client.get(`/restaurants/${restaurantId}/dishes`)

export const addDish = (dishData) => {
  const { restaurant_id, ...payload } = dishData
  return client.post(`/restaurants/${restaurant_id}/dishes`, payload)
}

export const updateDish = (restaurantId, id, dishData) =>
  client.put(`/restaurants/${restaurantId}/dishes/${id}`, dishData)

export const deleteDish = (restaurantId, id) =>
  client.delete(`/restaurants/${restaurantId}/dishes/${id}`)
