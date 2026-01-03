import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import NotificationDropdown from './NotificationDropdown';
import './Navbar.css';

const Navbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <button className="navbar-toggle" onClick={onToggleSidebar}>
          ☰
        </button>
        <h2 className="navbar-title">Incident Management System</h2>
      </div>

      <div className="navbar-right">
        {/* Notifications */}
        <div className="navbar-item">
          <button
            className="navbar-icon-btn"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <span className="icon">🔔</span>
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
          </button>
          {showNotifications && (
            <NotificationDropdown
              onClose={() => setShowNotifications(false)}
            />
          )}
        </div>

        {/* User Menu */}
        <div className="navbar-item dropdown">
          <button
            className="navbar-user-btn"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className="user-avatar">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <span className="user-name">{user?.name}</span>
            <span className="icon">▼</span>
          </button>

          {showUserMenu && (
            <div className="dropdown-menu">
              <div className="dropdown-header">
                <div className="user-info">
                  <p className="user-name-full">{user?.name}</p>
                  <p className="user-email">{user?.email}</p>
                  <p className="user-role">{user?.role}</p>
                </div>
              </div>
              <div className="dropdown-divider"></div>
              <button className="dropdown-item" onClick={() => {}}>
                👤 Profile
              </button>
              <button className="dropdown-item" onClick={() => {}}>
                ⚙️ Settings
              </button>
              <div className="dropdown-divider"></div>
              <button className="dropdown-item" onClick={handleLogout}>
                🚪 Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;