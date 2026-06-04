import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Settings, UtensilsCrossed } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { logout as logoutApi } from '../api/auth'
import { getRefreshToken } from '../utils/token'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = async () => {
    const refreshToken = getRefreshToken()
    try {
      if (refreshToken) await logoutApi({ refresh_token: refreshToken })
    } catch (e) {
      // ignore errors on logout
    }
    logout()
    navigate('/')
    setMenuOpen(false)
  }

  const isActive = path => location.pathname === path ? 'nav-link active' : 'nav-link'

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="navbar-brand" onClick={() => setMenuOpen(false)}>
          <UtensilsCrossed size={22} aria-hidden /> <span>FoodScope</span>
        </Link>

        <button className="hamburger" onClick={() => setMenuOpen(v => !v)} aria-label="Toggle menu">
          <span></span><span></span><span></span>
        </button>

        <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          <Link to="/restaurants" className={isActive('/restaurants')} onClick={() => setMenuOpen(false)}>Restaurants</Link>
          <Link to="/search" className={isActive('/search')} onClick={() => setMenuOpen(false)}>Search</Link>

          {user ? (
            <>
              <Link to="/notifications" className={isActive('/notifications')} onClick={() => setMenuOpen(false)}>Notifications</Link>
              {user.role === 'reviewer' && (
                <Link to="/dashboard/reviewer" className={isActive('/dashboard/reviewer')} onClick={() => setMenuOpen(false)}>
                  My Dashboard
                </Link>
              )}
              <Link to="/profile" className={isActive('/profile')} onClick={() => setMenuOpen(false)}>
                <span className="avatar-sm">{user.name?.[0]?.toUpperCase() || 'U'}</span>
                {user.name?.split(' ')[0]}
              </Link>
              {user.role === 'admin' && (
                <Link to="/admin" className={`nav-link admin-link ${location.pathname.startsWith('/admin') ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
                  <Settings size={16} aria-hidden /> Admin
                </Link>
              )}
              <button onClick={handleLogout} className="btn btn-outline btn-sm">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className={isActive('/login')} onClick={() => setMenuOpen(false)}>Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm" onClick={() => setMenuOpen(false)}>Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
