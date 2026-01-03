import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllIncidents } from '../../api/incidentApi';
import LoadingSpinner from '../common/LoadingSpinner';
import StatusBadge from '../common/StatusBadge';
import { formatDateTime, formatRelativeTime } from '../../utils/formatters';
import { toast } from 'react-toastify';
import './RecentIncidents.css';

const RecentIncidents = () => {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentIncidents();
  }, []);

  const fetchRecentIncidents = async () => {
    try {
      setLoading(true);
      const data = await getAllIncidents({ limit: 10, sort: '-createdAt' });
      setIncidents(data.incidents || []);
    } catch (error) {
      toast.error(error.message || 'Failed to load recent incidents');
    } finally {
      setLoading(false);
    }
  };

  const handleIncidentClick = (id) => {
    navigate(`/incidents/${id}`);
  };

  if (loading) {
    return <LoadingSpinner text="Loading recent incidents..." />;
  }

  return (
    <div className="recent-incidents">
      <div className="section-header">
        <h2 className="section-title">Recent Incidents</h2>
        <button
          className="btn btn-outline-primary btn-sm"
          onClick={() => navigate('/incidents')}
        >
          View All
        </button>
      </div>

      {incidents.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state-title">No incidents found</p>
          <p className="empty-state-description">
            Create your first incident to get started
          </p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Reporter</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {incidents.map((incident) => (
                <tr
                  key={incident._id}
                  onClick={() => handleIncidentClick(incident._id)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>
                    <span className="incident-number">
                      {incident.incidentNumber}
                    </span>
                  </td>
                  <td>
                    <span className="incident-title">{incident.title}</span>
                  </td>
                  <td>
                    <StatusBadge status={incident.severity} type="severity" />
                  </td>
                  <td>
                    <StatusBadge status={incident.status} type="status" />
                  </td>
                  <td>{incident.reporter?.name || 'Unknown'}</td>
                  <td>
                    <span className="incident-time" title={formatDateTime(incident.createdAt)}>
                      {formatRelativeTime(incident.createdAt)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RecentIncidents;