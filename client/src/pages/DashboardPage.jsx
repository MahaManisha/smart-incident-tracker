import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/common/Layout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import DashboardStats from '../components/analytics/DashboardStats';
import RecentIncidents from '../components/incidents/RecentIncidents';
import { getDashboardStats } from '../api/analyticsApi';
import { toast } from 'react-toastify';
import { FaClipboardList, FaFileAlt, FaBrain } from 'react-icons/fa';
import './DashboardPage.css';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); // Use context instead of localStorage
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Safety timeout to prevent infinite loading
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timed out')), 10000)
        );

        // If user is reporter, we don't need stats
        if (user?.role === 'REPORTER') {
          if (isMounted) setLoading(false);
          return;
        }

        // Race data fetch against timeout
        const response = await Promise.race([
          getDashboardStats(),
          timeoutPromise
        ]);

        if (isMounted) {
          // API returns { metrics: ... }
          // Or if wrapping (axios interceptor logic), check api/axiosConfig. We assume response.data or response is handled.
          // Based on analyticsController: res.json({ metrics })
          // Based on analyticsApi: return response (axios response object usually).

          // Let's safe access:
          // Axios interceptor returns response.data directly
          const metrics = response;
          if (!metrics) throw new Error('Invalid data format received');

          setStats(metrics);
        }
      } catch (err) {
        console.error('Dashboard data load failed:', err);
        if (isMounted) {
          setError(err.message || 'Failed to load statistics');
          // toast.error('Could not load dashboard stats.'); // Optional: reduce noise if banner exists
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (user) {
      loadData();
    } else {
      // If no user yet (auth still init), wait or handle? 
      // AuthContext handled initially, so user should be present if we reached here.
      // But just in case:
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleKnowledgeBaseClick = () => {
    navigate('/knowledge-base');
  };

  const handleReportIncident = () => {
    navigate('/incidents/new');
  };

  const handleViewMyIncidents = () => {
    navigate('/incidents');
  };

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </Layout>
    );
  }

  const role = user?.role;

  // Reporter-specific dashboard
  if (role === 'REPORTER') {
    return (
      <Layout>
        <div className="dashboard-page">
          <div className="page-header">
            <h1 className="page-title">My Dashboard</h1>
            <p className="page-description">
              Report and track your incidents
            </p>
          </div>

          {/* Reporter Quick Actions */}
          <div className="dashboard-actions">
            <div
              className="dashboard-action-card primary-action"
              onClick={handleReportIncident}
            >
              <div className="action-card-icon"><FaFileAlt /></div>
              <h3>Report New Incident</h3>
              <p>Submit a new incident report for review and resolution</p>
            </div>

            <div
              className="dashboard-action-card"
              onClick={handleViewMyIncidents}
            >
              <div className="action-card-icon"><FaClipboardList /></div>
              <h3>My Incidents</h3>
              <p>View and track all incidents you've reported</p>
            </div>
          </div>

          {/* Recent Incidents - Reporter sees only their own */}
          <div className="dashboard-grid">
            <div className="dashboard-section">
              <RecentIncidents userScope={true} />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Admin/Responder dashboard (original view)
  return (
    <Layout>
      <div className="dashboard-page">
        <div className="page-header">
          <h1 className="page-title">Incident Analytics</h1>
          <p className="page-description">
            Real-time operational metrics and SLA health
          </p>
        </div>

        {error && (
          <div className="error-banner-container">
            <div className="error-banner-content">
              <span className="error-icon">⚠️</span>
              <div className="error-text">
                <strong>Unable to load statistics.</strong>
                <span className="error-detail"> {error}</span>
              </div>
            </div>
            <button
              className="retry-btn"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        )}

        {/* Show stats if available, otherwise show nothing or placeholder */}
        {stats && <DashboardStats stats={stats} />}

        {/* Quick Actions - Only for ADMIN and RESPONDER */}
        {(role === 'ADMIN' || role === 'RESPONDER') && (
          <div className="dashboard-actions">
            <div
              className="dashboard-action-card knowledge-base-card"
              onClick={handleKnowledgeBaseClick}
            >
              <div className="action-card-icon"><FaBrain /></div>
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