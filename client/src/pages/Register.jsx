import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register as registerApi } from '../api/auth'

const validateName = (name) => {
  const trimmed = name.trim()
  if (trimmed.length < 2) return 'Name must be at least 2 characters.'
  if (trimmed.length > 50) return 'Name must be 50 characters or fewer.'
  if (!/^[a-zA-Z\s'\-]+$/.test(trimmed)) return 'Name can only contain letters, spaces, hyphens, and apostrophes.'
  return null
}

const validateEmail = (email) => {
  if (!email.trim()) return 'Email is required.'
  if (!/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(email)) return 'Enter a valid email address.'
  return null
}

const passwordRules = [
  { test: (pw) => pw.length >= 8, label: 'At least 8 characters' },
  { test: (pw) => /[A-Z]/.test(pw), label: 'One uppercase letter' },
  { test: (pw) => /[a-z]/.test(pw), label: 'One lowercase letter' },
  { test: (pw) => /[0-9]/.test(pw), label: 'One number' },
  { test: (pw) => /[^A-Za-z0-9]/.test(pw), label: 'One special character (e.g. !@#$%)' },
]

const validatePassword = (pw) => {
  for (const rule of passwordRules) {
    if (!rule.test(pw)) return `Password must include: ${rule.label.toLowerCase()}.`
  }
  return null
}

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user' })
  const [fieldErrors, setFieldErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
    setFieldErrors({ ...fieldErrors, [name]: null })
  }

  const validateAll = () => {
    const errors = {}
    const nameErr = validateName(form.name)
    if (nameErr) errors.name = nameErr
    const emailErr = validateEmail(form.email)
    if (emailErr) errors.email = emailErr
    const pwErr = validatePassword(form.password)
    if (pwErr) errors.password = pwErr
    return errors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    const errors = validateAll()
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }
    setLoading(true)
    try {
      const res = await registerApi(form)
      const msg = res.data?.message || 'Account created! You can now sign in.'
      setSuccess(msg)
      const needsVerification = msg.toLowerCase().includes('verify')
      if (!needsVerification) {
        setTimeout(() => navigate('/login'), 2500)
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const pwStrength = passwordRules.filter((r) => r.test(form.password)).length

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-icon">🍽️</span>
          <h1>Create account</h1>
          <p>Join FoodScope and discover great food</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="form-group">
            <label className="label" htmlFor="name">Full Name</label>
            <input
              id="name"
              name="name"
              type="text"
              className={`form-control${fieldErrors.name ? ' input-error' : ''}`}
              placeholder="Jane Doe"
              value={form.name}
              onChange={handleChange}
              autoComplete="name"
            />
            {fieldErrors.name && <p className="field-error">{fieldErrors.name}</p>}
          </div>

          <div className="form-group">
            <label className="label" htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              className={`form-control${fieldErrors.email ? ' input-error' : ''}`}
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
            />
            {fieldErrors.email && <p className="field-error">{fieldErrors.email}</p>}
          </div>

          <div className="form-group">
            <label className="label" htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              className={`form-control${fieldErrors.password ? ' input-error' : ''}`}
              placeholder="Create a strong password"
              value={form.password}
              onChange={handleChange}
              autoComplete="new-password"
            />
            {form.password.length > 0 && (
              <div className="password-strength">
                <div className="strength-bar">
                  {passwordRules.map((_, i) => (
                    <div
                      key={i}
                      className={`strength-segment${i < pwStrength ? ` strength-${pwStrength <= 2 ? 'weak' : pwStrength <= 4 ? 'medium' : 'strong'}` : ''}`}
                    />
                  ))}
                </div>
                <ul className="password-rules">
                  {passwordRules.map((rule) => (
                    <li key={rule.label} className={rule.test(form.password) ? 'rule-pass' : 'rule-fail'}>
                      {rule.test(form.password) ? '✓' : '✗'} {rule.label}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {fieldErrors.password && <p className="field-error">{fieldErrors.password}</p>}
          </div>

          <div className="form-group">
            <label className="label" htmlFor="role">I want to</label>
            <select id="role" name="role" className="form-control" value={form.role} onChange={handleChange}>
              <option value="user">Browse restaurants & food</option>
              <option value="reviewer">Write reviews & list restaurants</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
