import { formatNumber } from '../../utils/formatters';
import './DashboardStats.css';

const DashboardStats = ({ stats }) => {
  const statCards = [
    {
      title: 'Open Incidents',
      value: stats.openIncidents || 0,
      icon: '🚨',
      color: 'primary',
      trend: stats.openTrend,
    },
    {
      title: 'In Progress',
      value: stats.inProgressIncidents || 0,
      icon: '⚙️',
      color: 'warning',
      trend: stats.inProgressTrend,
    },
    {
      title: 'Resolved Today',
      value: stats.resolvedToday || 0,
      icon: '✅',
      color: 'success',
      trend: stats.resolvedTrend,
    },
    {
      title: 'SLA Breaches',
      value: stats.slaBreaches || 0,
      icon: '⚠️',
      color: 'danger',
      trend: stats.breachTrend,
    },
  ];

  return (
    <div className="dashboard-stats">
      {statCards.map((stat, index) => (
        <div key={index} className={`stat-card stat-card-${stat.color}`}>
          <div className="stat-icon">{stat.icon}</div>
          <div className="stat-content">
            <p className="stat-title">{stat.title}</p>
            <h3 className="stat-value">{formatNumber(stat.value)}</h3>
            {stat.trend && (
              <span className={`stat-trend ${stat.trend > 0 ? 'up' : 'down'}`}>
                {stat.trend > 0 ? '↑' : '↓'} {Math.abs(stat.trend)}%
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashboardStats;