import { useState, useEffect } from 'react'
import { Bell, Info, MessageCircle, Star, Store } from 'lucide-react'
import { getNotifications } from '../api/users'
import Spinner from '../components/Spinner'

const NotificationTypeIcon = ({ type }) => {
  const props = { size: 18, 'aria-hidden': true }
  switch (type) {
    case 'restaurant_status':
      return <Store {...props} />
    case 'review':
      return <Star {...props} />
    case 'comment':
      return <MessageCircle {...props} />
    case 'system':
      return <Info {...props} />
    default:
      return <Bell {...props} />
  }
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [error, setError] = useState('')

  const fetchNotifications = () => {
    setLoading(true)
    getNotifications({ unread_only: unreadOnly })
      .then(res => setNotifications(res.data.notifications || []))
      .catch(err => setError(err.response?.data?.error?.message || 'Could not load notifications.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchNotifications() }, [unreadOnly])

  return (
    <div className="container notifications-page">
      <div className="page-top">
        <h1 className="page-title">Notifications</h1>
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={e => setUnreadOnly(e.target.checked)}
          />
          Unread only
        </label>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="center-spinner"><Spinner /></div>
      ) : notifications.length === 0 ? (
        <div className="empty-state">
          <p><Bell size={18} aria-hidden /> No {unreadOnly ? 'unread ' : ''}notifications yet.</p>
        </div>
      ) : (
        <div className="notifications-list">
          {notifications.map(notif => (
            <div key={notif.id || notif._id} className={`notification-item ${notif.is_read ? '' : 'unread'}`}>
              <span className="notif-icon"><NotificationTypeIcon type={notif.type} /></span>
              <div className="notif-body">
                <p className="notif-message">{notif.message}</p>
                <span className="notif-date">
                  {notif.created_at ? new Date(notif.created_at).toLocaleString() : ''}
                </span>
              </div>
              {!notif.is_read && <span className="unread-dot"></span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
