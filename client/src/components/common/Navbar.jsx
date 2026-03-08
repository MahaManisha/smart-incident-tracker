import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';
import {
  FaBars,
  FaBell,
  FaChevronDown,
  FaSignOutAlt,
  FaCog,
  FaUser,
  FaUserCircle
} from 'react-icons/fa';
import NotificationDropdown from './NotificationDropdown';
import './Navbar.css';

const Navbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <button className="navbar-toggle" onClick={onToggleSidebar} aria-label="Toggle Sidebar">
          <FaBars />
        </button>
        <h2 className="navbar-title">Incident Management</h2>
      </div>

      <div className="navbar-right">
        {/* Notifications */}
        <div className="navbar-item">
          <button
            className="navbar-icon-btn"
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
          >
            <FaBell />
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
            aria-label="User Menu"
          >
            <div className="user-avatar">
              {user?.profileImage ? (
                <img src={`/${user.profileImage}`} alt={user.name} className="nav-avatar-img" />
              ) : (
                <FaUserCircle className="default-avatar-icon" />
              )}
            </div>
            <span className="user-name">{user?.name}</span>
            <span className="icon"><FaChevronDown style={{ fontSize: '0.8em' }} /></span>
          </button>

          {showUserMenu && (
            <div className="dropdown-menu">
              <div className="dropdown-header">
                <div className="user-info">
                  <p className="user-name-full">{user?.name}</p>
                  <p className="user-email">{user?.email}</p>
                  <span className="user-role">{user?.role}</span>
                </div>
              </div>
              <div className="dropdown-divider"></div>
              <button
                className="dropdown-item"
                onClick={() => {
                  navigate('/profile');
                  setShowUserMenu(false);
                }}
              >
                <FaUser className="dropdown-icon" /> Profile
              </button>
              <button className="dropdown-item" onClick={() => {
                navigate('/settings');
                setShowUserMenu(false);
              }}>
                <FaCog className="dropdown-icon" /> Settings
              </button>
              <div className="dropdown-divider"></div>
              <button className="dropdown-item" onClick={handleLogout}>
                <FaSignOutAlt className="dropdown-icon" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;