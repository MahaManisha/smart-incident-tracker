import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../contexts/NotificationContext';
import { formatRelativeTime } from '../../utils/formatters';
import './NotificationDropdown.css';

const NotificationDropdown = ({ onClose }) => {
  const navigate = useNavigate();
  const {
    notifications,
    loading,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  } = useNotifications();

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      await markNotificationAsRead(notification._id);
    }

    // Navigate to related incident
    if (notification.incidentId) {
      navigate(`/incidents/${notification.incidentId}`);
      onClose();
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllNotificationsAsRead();
  };

  return (
    <div className="notification-dropdown">
      <div className="notification-header">
        <h3>Notifications</h3>
        {notifications.length > 0 && (
          <button
            className="btn-link text-xs"
            onClick={handleMarkAllAsRead}
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="notification-list">
        {loading ? (
          <div className="notification-loading">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="notification-empty">
            <p>No notifications</p>
          </div>
        ) : (
          notifications.slice(0, 10).map((notification) => (
            <div
              key={notification._id}
              className={`notification-item ${!notification.read ? 'unread' : ''}`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="notification-content">
                <p className="notification-message">{notification.message}</p>
                <span className="notification-time">
                  {formatRelativeTime(notification.createdAt)}
                </span>
              </div>
              {!notification.read && <div className="notification-dot"></div>}
            </div>
          ))
        )}
      </div>

      {notifications.length > 10 && (
        <div className="notification-footer">
          <button
            className="btn-link"
            onClick={() => {
              navigate('/notifications');
              onClose();
            }}
          >
            View all notifications
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;