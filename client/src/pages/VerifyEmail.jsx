import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import client from '../api/client'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState('verifying')
  const [message, setMessage] = useState('')
  const [resendEmail, setResendEmail] = useState('')
  const [resendStatus, setResendStatus] = useState('')
  const [resendLoading, setResendLoading] = useState(false)

  useEffect(() => {
    if (!token) {
      setStatus('no-token')
      return
    }
    client.post('/auth/verify-email', { token })
      .then(() => setStatus('success'))
      .catch((err) => {
        const msg = err.response?.data?.error?.message || 'Verification failed. The link may have expired.'
        setMessage(msg)
        setStatus('error')
      })
  }, [token])

  const handleResend = async (e) => {
    e.preventDefault()
    if (!resendEmail.trim()) return
    setResendLoading(true)
    setResendStatus('')
    try {
      await client.post('/auth/resend-verification', { email: resendEmail.trim() })
      setResendStatus('success')
    } catch (err) {
      setResendStatus(err.response?.data?.error?.message || 'Failed to resend. Please try again.')
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-icon">🍽️</span>
          <h1>Email Verification</h1>
        </div>

        {status === 'verifying' && (
          <div className="alert alert-info" style={{ textAlign: 'center' }}>Verifying your email…</div>
        )}

        {status === 'success' && (
          <>
            <div className="alert alert-success">✓ Your email has been verified! You can now log in.</div>
            <Link to="/login" className="btn btn-primary btn-full" style={{ marginTop: 16 }}>Go to Login</Link>
          </>
        )}

        {(status === 'error' || status === 'no-token') && (
          <>
            <div className="alert alert-error">{message || 'No verification token found. Please use the link from your email.'}</div>
            <div style={{ marginTop: 24 }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                Need a new verification link? Enter your email below:
              </p>
              <form onSubmit={handleResend} className="auth-form">
                <div className="form-group">
                  <input
                    type="email"
                    className="form-control"
                    placeholder="your@email.com"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    required
                  />
                </div>
                {resendStatus === 'success' && (
                  <div className="alert alert-success">Verification email sent — check your inbox.</div>
                )}
                {resendStatus && resendStatus !== 'success' && (
                  <div className="alert alert-error">{resendStatus}</div>
                )}
                <button type="submit" className="btn btn-primary btn-full" disabled={resendLoading}>
                  {resendLoading ? 'Sending…' : 'Resend Verification Email'}
                </button>
              </form>
            </div>
          </>
        )}

        <p className="auth-footer" style={{ marginTop: 16 }}>
          <Link to="/login">Back to Login</Link>
        </p>
      </div>
    </div>
  )
}
