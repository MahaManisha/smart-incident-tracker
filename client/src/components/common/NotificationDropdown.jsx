import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../contexts/NotificationContext';
import { formatDateTime } from '../../utils/formatters';
import { FaCheck, FaTimes, FaCircle } from 'react-icons/fa';
import './NotificationDropdown.css';

const NotificationDropdown = ({ onClose }) => {
  const { notifications, markAsRead } = useNotifications();
  const navigate = useNavigate();

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      await markAsRead(notification._id);
    }
    onClose();
    if (notification.incident) {
      navigate(`/incidents/${notification.incident}`);
    }
  };

  const handleMarkAllRead = async (e) => {
    e.stopPropagation();
    await markAsRead('all');
  };

  return (
    <div className="notification-dropdown">
      <div className="notification-header">
        <h3>Notifications</h3>
        {notifications.length > 0 && (
          <button className="mark-read-btn" onClick={handleMarkAllRead}>
            Mark all read
          </button>
        )}
        <button className="close-btn" onClick={onClose}><FaTimes /></button>
      </div>

      <div className="notification-list">
        {notifications.length === 0 ? (
          <div className="empty-notifications">
            <p>No notifications</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification._id}
              className={`notification-item ${!notification.read ? 'unread' : ''}`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="notification-icon">
                {!notification.read && <FaCircle className="unread-dot" />}
              </div>
              <div className="notification-content">
                <p className="notification-title">{notification.title}</p>
                <p className="notification-message">{notification.message}</p>
                <span className="notification-time">
                  {formatDateTime(notification.createdAt)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationDropdown;