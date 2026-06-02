import client from './client'

export const getTags = params => client.get('/tags', { params })
export const createTag = data => client.post('/tags', data)
export const assignTag = (restaurantId, data) => client.post(`/restaurants/${restaurantId}/tags`, data)
