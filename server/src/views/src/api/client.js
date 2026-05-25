import axios from 'axios'

const client = axios.create({
  baseURL: '/api/v1'
})

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

client.interceptors.request.use(config => {
  const token = localStorage.getItem('foodscope_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

client.interceptors.response.use(
  response => response,
  error => {
    error.apiError = createApiErrorPayload(error)
    if (error.response?.status === 401 && window.location.pathname !== '/login') {
      localStorage.removeItem('foodscope_token')
      delete client.defaults.headers.common['Authorization']
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default client
