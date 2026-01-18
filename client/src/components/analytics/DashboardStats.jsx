import { formatNumber } from '../../utils/formatters';
import './DashboardStats.css';

const DashboardStats = ({ stats }) => {
  const statCards = [
    {
      title: 'Open Incidents',
      value: stats?.openIncidents || 0,
      icon: '🚨',
      color: 'primary',
      trend: stats?.openTrend,
      description: 'Unassigned incidents',
    },
    {
      title: 'In Progress',
      value: stats?.inProgressIncidents || 0,
      icon: '⚙️',
      color: 'warning',
      trend: stats?.inProgressTrend,
      description: 'Currently being resolved',
    },
    {
      title: 'Resolved Today',
      value: stats?.resolvedToday || 0,
      icon: '✅',
      color: 'success',
      trend: stats?.resolvedTrend,
      description: 'Closed incidents today',
    },
    {
      title: 'SLA Breaches',
      value: stats?.slaBreaches || 0,
      icon: '⚠️',
      color: 'danger',
      trend: stats?.breachTrend,
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