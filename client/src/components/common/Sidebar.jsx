import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { USER_ROLES } from '../../utils/constants';
import {
  FaChartBar,
  FaExclamationTriangle,
  FaPlus,
  FaChartLine,
  FaUsers,
  FaUserFriends,
  FaCog,
  FaUser,
  FaFileAlt,
  FaLevelUpAlt,
  FaPhoneVolume,
  FaLayerGroup,
  FaNetworkWired,
  FaBullseye
} from 'react-icons/fa';
import './Sidebar.css';

const Sidebar = ({ isOpen }) => {
  const { user, hasRole, hasAnyRole } = useAuth();

  const navItems = [
    {
      path: '/dashboard',
      icon: <FaChartBar />,
      label: 'Dashboard',
      roles: [USER_ROLES.ADMIN, USER_ROLES.RESPONDER, USER_ROLES.REPORTER],
    },
    {
      path: '/incidents',
      icon: <FaExclamationTriangle />,
      label: 'My Incidents',
      roles: [USER_ROLES.REPORTER],
    },
    {
      path: '/incidents',
      icon: <FaExclamationTriangle />,
      label: 'Incidents',
      roles: [USER_ROLES.ADMIN, USER_ROLES.RESPONDER],
    },
    {
      path: '/reporter/my-documents',
      icon: <FaFileAlt />,
      label: 'My Documents',
      roles: [USER_ROLES.REPORTER, USER_ROLES.RESPONDER, USER_ROLES.ADMIN],
    },
    {
      path: '/incidents/create',
      icon: <FaPlus />,
      label: 'Report Incident',
      roles: [USER_ROLES.REPORTER],
    },
    {
      path: '/incidents/create',
      icon: <FaPlus />,
      label: 'Create Incident',
      roles: [USER_ROLES.ADMIN],
    },
    {
      path: '/analytics',
      icon: <FaChartLine />,
      label: 'Analytics',
      roles: [USER_ROLES.ADMIN],
    },
    {
      path: '/users',
      icon: <FaUsers />,
      label: 'Users',
      roles: [USER_ROLES.ADMIN],
    },

    {
      path: '/teams',
      icon: <FaUserFriends />,
      label: 'Teams',
      roles: [USER_ROLES.ADMIN, USER_ROLES.RESPONDER],
    },
    {
      path: '/sla-config',
      icon: <FaCog />,
      label: 'SLA Config',
      roles: [USER_ROLES.ADMIN],
    },
    {
      path: '/escalation-config',
      icon: <FaLevelUpAlt />,
      label: 'Escalation',
      roles: [USER_ROLES.ADMIN],
    },
    {
      path: '/oncall',
      icon: <FaPhoneVolume />,
      label: 'On-Call',
      roles: [USER_ROLES.ADMIN, USER_ROLES.RESPONDER],
    },
    {
      path: '/services',
      icon: <FaNetworkWired />,
      label: 'Inventory',
      roles: [USER_ROLES.ADMIN, USER_ROLES.RESPONDER],
    },
    {
      path: '/service-map',
      icon: <FaNetworkWired style={{ transform: 'rotate(90deg)' }} />,
      label: 'Map',
      roles: [USER_ROLES.ADMIN, USER_ROLES.RESPONDER],
    },
    {
      path: '/incident-templates',
      icon: <FaLayerGroup />,
      label: 'Templates',
      roles: [USER_ROLES.ADMIN],
    },
    {
      path: '/profile',
      icon: <FaUser />,
      label: 'Profile',
      roles: [USER_ROLES.ADMIN, USER_ROLES.RESPONDER, USER_ROLES.REPORTER],
    },
  ];

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <span className="logo-icon"><FaBullseye /></span>
          <span className="logo-text">IMS</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <ul className="nav-list">
          {navItems.map((item, index) => {
            // Check if user has required role
            if (!hasAnyRole(item.roles)) {
              return null;
            }

            return (
              <li key={`${item.path}-${index}`} className="nav-item">
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
        <NavLink to="/profile" className="user-info-sidebar">
          <div className="user-avatar-small">
            {user?.profileImage ? (
              <img src={`/${user.profileImage}`} alt={user.name} className="sidebar-avatar-img" />
            ) : (
              <div className="avatar-placeholder-icon">
                <FaUser />
              </div>
            )}
          </div>
          <div className="user-details">
            <p className="user-name-sidebar">{user?.name}</p>
            <p className="user-role-sidebar">{user?.role}</p>
          </div>
        </NavLink>
      </div>
    </aside>
  );
};

export default Sidebar;