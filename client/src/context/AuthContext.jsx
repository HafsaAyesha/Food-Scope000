import { createContext, useContext, useState, useEffect } from 'react'
import { getMe } from '../api/auth'
import { getAccessToken, setTokens, clearTokens } from '../utils/token'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = getAccessToken()
    if (token) {
      getMe()
        .then((res) => setUser(res.data?.user ?? res.data))
        .catch(() => {
          clearTokens()
          setUser(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = (data) => {
    const { access_token, refresh_token, user: userData } = data
    setTokens(access_token, refresh_token)
    setUser(userData)
  }

  const logout = () => {
    clearTokens()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
