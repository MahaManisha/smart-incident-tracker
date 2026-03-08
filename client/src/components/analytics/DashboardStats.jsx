import { formatNumber } from '../../utils/formatters';
import { FaExclamationCircle, FaSpinner, FaCheckCircle, FaClock } from 'react-icons/fa';
import './DashboardStats.css';

const DashboardStats = ({ stats }) => {
  const statCards = [
    {
      title: 'Open Incidents',
      value: stats?.summary?.open || 0,
      icon: <FaExclamationCircle />,
      color: 'open',
      trend: null,
      description: 'Active/Unassigned incidents',
    },
    {
      title: 'In Progress',
      value: stats?.summary?.inProgress || 0,
      icon: <FaSpinner />,
      color: 'progress',
      trend: null,
      description: 'Currently being resolved',
    },
    {
      title: 'Resolved Today',
      value: stats?.summary?.resolvedToday || 0,
      icon: <FaCheckCircle />,
      color: 'resolved',
      trend: null,
      description: 'Closed incidents today',
    },
    {
      title: 'SLA Breaches',
      value: stats?.summary?.slaBreaches || 0,
      icon: <FaClock />,
      color: 'critical',
      trend: null,
      description: 'Exceeded response time',
    },
  ];

  return (
    <div className="dashboard-stats">
      {statCards.map((stat, index) => (
        <div key={index} className={`stat-card stat-card-${stat.color}`}>
          <div className="stat-header">
            <div className="stat-icon">{stat.icon}</div>
            {stat.trend !== undefined && stat.trend !== null && (
              <span className={`stat-trend ${stat.trend >= 0 ? 'up' : 'down'}`}>
                {stat.trend >= 0 ? '↑' : '↓'} {Math.abs(stat.trend)}%
              </span>
            )}
          </div>
          <div className="stat-content">
            <h3 className="stat-value">{formatNumber(stat.value)}</h3>
            <p className="stat-title">{stat.title}</p>
            <p className="stat-description">{stat.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashboardStats;