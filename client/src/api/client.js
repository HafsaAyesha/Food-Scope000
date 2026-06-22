import axios from 'axios'
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from '../utils/token'

const API_BASE_URL = 'http://localhost:3000/api/v1'

const client = axios.create({
  baseURL: API_BASE_URL
})

let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error)
    } else {
      resolve(token)
    }
  })
  failedQueue = []
}

const createApiErrorPayload = (error) => {
  const status = error.response?.status
  const serverPayload = error.response?.data
  const base = {
    status,
    retryable: false,
    code: 'NETWORK_ERROR',
    type: 'NETWORK_ERROR',
    message: error.message || 'Network error. Please try again.',
    details: null
  }

  if (error.response) {
    if (serverPayload?.error) {
      return {
        ...base,
        retryable: [429, 502, 503, 504].includes(status),
        code: serverPayload.error.code || base.code,
        type: serverPayload.error.type || base.type,
        message: serverPayload.error.message || base.message,
        details: serverPayload.error.details || null
      }
    }
    return {
      ...base,
      retryable: [429, 502, 503, 504].includes(status),
      code: error.response.statusText || `HTTP_${status}`,
      message: error.response.data?.message || base.message
    }
  }

  return { ...base, retryable: true }
}

const shouldSkipRefresh = (config) => {
  const url = config?.url || ''
  return (
    url.includes('/auth/login') ||
    url.includes('/auth/register') ||
    url.includes('/auth/refresh')
  )
}

client.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    error.apiError = createApiErrorPayload(error)

    const originalRequest = error.config
    const status = error.response?.status

    if (status !== 401 || !originalRequest || originalRequest._retry || shouldSkipRefresh(originalRequest)) {
      return Promise.reject(error)
    }

    if (window.location.pathname === '/login') {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`
        return client(originalRequest)
      })
    }

    originalRequest._retry = true
    isRefreshing = true

    const refreshToken = getRefreshToken()
    if (!refreshToken) {
      clearTokens()
      window.location.href = '/login'
      return Promise.reject(error)
    }

    try {
      const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
        refresh_token: refreshToken
      })
      setTokens(data.access_token, data.refresh_token)
      processQueue(null, data.access_token)
      originalRequest.headers.Authorization = `Bearer ${data.access_token}`
      return client(originalRequest)
    } catch (refreshError) {
      processQueue(refreshError, null)
      clearTokens()
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)

export default client
