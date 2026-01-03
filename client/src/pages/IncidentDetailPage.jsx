import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/common/Layout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatusBadge from '../components/common/StatusBadge';
import Button from '../components/common/Button';
import IncidentActions from '../components/incidents/IncidentActions';
import CommentSection from '../components/incidents/CommentSection';
import { getIncidentById } from '../api/incidentApi';
import { useAuth } from '../contexts/AuthContext';
import { USER_ROLES } from '../utils/constants';
import {
  formatDateTime,
  formatUserName,
  calculateTimeRemaining,
} from '../utils/formatters';
import { toast } from 'react-toastify';
import './IncidentDetailPage.css';

const IncidentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIncident();
  }, [id]);

  const fetchIncident = async () => {
    try {
      setLoading(true);
      const data = await getIncidentById(id);
      setIncident(data.incident);
    } catch (error) {
      toast.error(error.message || 'Failed to load incident');
      navigate('/incidents');
    } finally {
      setLoading(false);
    }
  };

  const handleIncidentUpdated = () => {
    fetchIncident();
  };

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner size="lg" text="Loading incident details..." />
      </Layout>
    );
  }

  if (!incident) {
    return (
      <Layout>
        <div className="empty-state">
          <p className="empty-state-title">Incident not found</p>
        </div>
      </Layout>
    );
  }

  const timeRemaining = calculateTimeRemaining(incident.slaDeadline);

  return (
    <Layout>
      <div className="incident-detail-page">
        <div className="page-header">
          <div>
            <div className="incident-header-top">
              <h1 className="page-title">{incident.incidentNumber}</h1>
              <div className="incident-badges">
                <StatusBadge status={incident.severity} type="severity" />
                <StatusBadge status={incident.status} type="status" />
              </div>
            </div>
            <p className="page-description">{incident.title}</p>
          </div>
          <Button
            variant="secondary"
            onClick={() => navigate('/incidents')}
          >
            ← Back to Incidents
          </Button>
        </div>

        <div className="incident-detail-grid">
          {/* Main Content */}
          <div className="incident-main">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Description</h3>
              </div>
              <div className="card-body">
                <p className="incident-description">{incident.description}</p>
              </div>
            </div>

            {/* Additional Info */}
            {incident.additionalInfo && (
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Additional Information</h3>
                </div>
                <div className="card-body">
                  <p>{incident.additionalInfo}</p>
                </div>
              </div>
            )}

            {/* Comments */}
            <CommentSection
              incidentId={incident._id}
              onCommentAdded={handleIncidentUpdated}
            />
          </div>

          {/* Sidebar */}
          <div className="incident-sidebar">
            {/* Actions */}
            {(hasRole(USER_ROLES.ADMIN) ||
              incident.responder?._id === user?._id) && (
              <IncidentActions
                incident={incident}
                onUpdate={handleIncidentUpdated}
              />
            )}

            {/* Details Card */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Details</h3>
              </div>
              <div className="card-body">
                <div className="detail-list">
                  <div className="detail-item">
                    <span className="detail-label">Reporter</span>
                    <span className="detail-value">
                      {formatUserName(incident.reporter)}
                    </span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">Responder</span>
                    <span className="detail-value">
                      {incident.responder
                        ? formatUserName(incident.responder)
                        : 'Unassigned'}
                    </span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">Affected Service</span>
                    <span className="detail-value">
                      {incident.affectedService || '-'}
                    </span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">Impacted Users</span>
                    <span className="detail-value">
                      {incident.impactedUsers || '-'}
                    </span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">Created</span>
                    <span className="detail-value">
                      {formatDateTime(incident.createdAt)}
                    </span>
                  </div>

                  {incident.slaDeadline && (
                    <div className="detail-item">
                      <span className="detail-label">SLA Deadline</span>
                      <span
                        className={`detail-value ${
                          timeRemaining?.isOverdue ? 'text-danger' : ''
                        }`}
                      >
                        {timeRemaining?.text}
                      </span>
                    </div>
                  )}

                  {incident.resolvedAt && (
                    <div className="detail-item">
                      <span className="detail-label">Resolved At</span>
                      <span className="detail-value">
                        {formatDateTime(incident.resolvedAt)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default IncidentDetailPage;