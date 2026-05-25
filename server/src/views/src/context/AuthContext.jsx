import { createContext, useContext, useState, useEffect } from 'react'
import { getMe } from '../api/auth'
import client from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('foodscope_token')
    if (token) {
      client.defaults.headers.common['Authorization'] = `Bearer ${token}`
      getMe()
        .then(res => setUser(res.data))
        .catch(() => {
          localStorage.removeItem('foodscope_token')
          delete client.defaults.headers.common['Authorization']
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = (token, userData) => {
    localStorage.setItem('foodscope_token', token)
    client.defaults.headers.common['Authorization'] = `Bearer ${token}`
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('foodscope_token')
    delete client.defaults.headers.common['Authorization']
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
