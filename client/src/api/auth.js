import client from './client'

export const register = (data) => client.post('/auth/register', data)
export const login = (data) => client.post('/auth/login', data)
export const logout = (data) => client.post('/auth/logout', data)
export const refresh = (data) => client.post('/auth/refresh', data)
export const getMe = () => client.get('/auth/me')
export const forgotPassword = (data) => client.post('/auth/forgot-password', data)
export const resetPassword = (data) => client.post('/auth/reset-password', data)
