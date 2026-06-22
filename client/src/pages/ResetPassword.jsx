import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { resetPassword } from '../api/auth'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token. Please request a new reset link.')
    }
  }, [token])

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      await resetPassword({ token, new_password: newPassword })
      setSuccess(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Something went wrong. The link may have expired.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-icon">🔒</span>
          <h1>Set New Password</h1>
          <p>Choose a strong password for your account</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {success ? (
          <div className="alert alert-success">
            Your password has been reset successfully. Redirecting you to login…
          </div>
        ) : token ? (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="label" htmlFor="new-password">New Password</label>
              <input
                id="new-password"
                type="password"
                className="form-control"
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <div className="form-group">
              <label className="label" htmlFor="confirm-password">Confirm Password</label>
              <input
                id="confirm-password"
                type="password"
                className="form-control"
                placeholder="Repeat your new password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Resetting…' : 'Reset Password'}
            </button>
          </form>
        ) : null}

        <p className="auth-footer" style={{ marginTop: '16px' }}>
          <Link to="/forgot-password">Request a new reset link</Link>
          {' · '}
          <Link to="/login">Back to login</Link>
        </p>
      </div>
    </div>
  )
}
