import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/common/Layout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import DashboardStats from '../components/analytics/DashboardStats';
import RecentIncidents from '../components/incidents/RecentIncidents';
import { getDashboardStats } from '../api/analyticsApi';
import { toast } from 'react-toastify';
import './DashboardPage.css';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem('user'));
  const role = user?.role;

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await getDashboardStats();
      setStats(data);
    } catch (error) {
      toast.error(error.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleKnowledgeBaseClick = () => {
    navigate('/knowledge-base');
  };

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="dashboard-page">
        <div className="page-header">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-description">
            Overview of incident management system
          </p>
        </div>

        {stats && <DashboardStats stats={stats} />}

        {/* Quick Actions - Only for ADMIN and RESPONDER */}
        {(role === 'ADMIN' || role === 'RESPONDER') && (
          <div className="dashboard-actions">
            <div
              className="dashboard-action-card"
              onClick={handleKnowledgeBaseClick}
            >
              <div className="action-card-icon">🧠</div>
              <h3>Knowledge Base</h3>
              <p>
                Post-incident analysis, root cause documentation, and resolution strategies
              </p>
            </div>
          </div>
        )}

        <div className="dashboard-grid">
          <div className="dashboard-section">
            <RecentIncidents />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DashboardPage;