import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login as loginApi, getMe } from '../api/auth'
import { useAuth } from '../context/AuthContext'
import client from '../api/client'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await loginApi(form)
      const { access_token } = res.data

      // Set token on client before calling getMe
      client.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
      localStorage.setItem('foodscope_token', access_token)

      const meRes = await getMe()
      login(access_token, meRes.data)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Login failed. Check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-icon">🍽️</span>
          <h1>Welcome back</h1>
          <p>Sign in to your FoodScope account</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="label" htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              className="form-control"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label className="label" htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="auth-footer">
          <Link to="/forgot-password" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Forgot your password?</Link>
        </p>
        <p className="auth-footer">
          Don't have an account? <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  )
}
