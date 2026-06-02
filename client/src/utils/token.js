const ACCESS_TOKEN_KEY = 'foodscope_access_token'
const REFRESH_TOKEN_KEY = 'foodscope_refresh_token'

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function setTokens(access_token, refresh_token) {
  if (access_token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, access_token)
  }
  if (refresh_token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh_token)
  }
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  // legacy key from earlier client versions
  localStorage.removeItem('foodscope_token')
}
