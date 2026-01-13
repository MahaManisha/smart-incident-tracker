import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { USER_ROLES } from '../../utils/constants';
import './Sidebar.css';

const Sidebar = ({ isOpen }) => {
  const { user, hasRole, hasAnyRole } = useAuth();

  const navItems = [
    {
      path: '/dashboard',
      icon: '📊',
      label: 'Dashboard',
      roles: [USER_ROLES.ADMIN, USER_ROLES.RESPONDER, USER_ROLES.REPORTER],
    },
    {
      path: '/incidents',
      icon: '🚨',
      label: 'Incidents',
      roles: [USER_ROLES.ADMIN, USER_ROLES.RESPONDER, USER_ROLES.REPORTER],
    },
    {
      path: '/incidents/create',
      icon: '➕',
      label: 'Create Incident',
      roles: [USER_ROLES.ADMIN, USER_ROLES.REPORTER],
    },
    {
      path: '/analytics',
      icon: '📈',
      label: 'Analytics',
      roles: [USER_ROLES.ADMIN, USER_ROLES.RESPONDER],
    },
    {
      path: '/users',
      icon: '👥',
      label: 'Users',
      roles: [USER_ROLES.ADMIN],
    },
    {
      path: '/teams',
      icon: '👨‍👩‍👧‍👦',
      label: 'Teams',
      roles: [USER_ROLES.ADMIN],
    },
    {
      path: '/sla-config',
      icon: '⚙️',
      label: 'SLA Config',
      roles: [USER_ROLES.ADMIN],
    },
    {
      path: '/profile',
      icon: '👤',
      label: 'Profile',
      roles: [USER_ROLES.ADMIN, USER_ROLES.RESPONDER, USER_ROLES.REPORTER],
    },
  ];

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <span className="logo-icon">🎯</span>
          <span className="logo-text">IMS</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <ul className="nav-list">
          {navItems.map((item) => {
            // Check if user has required role
            if (!hasAnyRole(item.roles)) {
              return null;
            }

            return (
              <li key={item.path} className="nav-item">
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `nav-link ${isActive ? 'active' : ''}`
                  }
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <div className="user-info-sidebar">
          <div className="user-avatar-small">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="user-details">
            <p className="user-name-sidebar">{user?.name}</p>
            <p className="user-role-sidebar">{user?.role}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;