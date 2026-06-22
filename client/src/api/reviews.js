import client from './client'

export const getReviews = params => client.get('/reviews', { params })
export const createReview = data => client.post('/reviews', data)
export const updateReview = (id, data) => client.put(`/reviews/${id}`, data)
export const deleteReview = id => client.delete(`/reviews/${id}`)
export const voteReview = (id, data) => client.post(`/reviews/${id}/vote`, data)
export const flagReview = (id, data) => client.post(`/reviews/${id}/flag`, data)

export const getComments = reviewId => client.get(`/reviews/${reviewId}/comments`)
export const createComment = (reviewId, data) => client.post(`/reviews/${reviewId}/comments`, data)
export const deleteComment = (reviewId, commentId) => client.delete(`/reviews/${reviewId}/comments/${commentId}`)
