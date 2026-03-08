import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '../components/common/Layout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatusBadge from '../components/common/StatusBadge';
import Button from '../components/common/Button';
import PriorityBadge from '../components/common/PriorityBadge';
import IncidentActions from '../components/incidents/IncidentActions';
import AdminOverridePanel from '../components/incidents/AdminOverridePanel';
import CommentSection from '../components/incidents/CommentSection';
import IncidentTimeline from '../components/incidents/IncidentTimeline';
import IncidentDocuments from '../components/incidents/IncidentDocuments';
import { getIncidentById, updateIncidentPriority, deleteIncident } from '../api/incidentApi';
import { useAuth } from '../contexts/AuthContext';
import { USER_ROLES } from '../utils/constants';
import {
  formatDateTime,
  calculateTimeRemaining,
} from '../utils/formatters';
import { toast } from 'react-toastify';
import {
  FaHistory,
  FaNetworkWired,
  FaTools,
  FaArrowLeft,
  FaClock,
  FaShieldAlt,
  FaComments,
  FaLevelUpAlt
} from 'react-icons/fa';
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

  const handlePriorityChange = async (newPriority) => {
    try {
      setLoading(true);
      await updateIncidentPriority(id, newPriority);
      toast.success(`Priority updated to ${newPriority}`);
      fetchIncident();
    } catch (error) {
      toast.error(error.message || 'Failed to update priority');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this incident? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      await deleteIncident(id);
      toast.success('Incident deleted successfully');
      navigate('/incidents');
    } catch (error) {
      toast.error(error.message || 'Failed to delete incident');
      setLoading(false);
    }
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
          <Button onClick={() => navigate('/incidents')}>Back to Incidents</Button>
        </div>
      </Layout>
    );
  }

  const timeRemaining = calculateTimeRemaining(incident.slaDeadline);
  const isSlaBreached = incident.slaResponseStatus === 'BREACHED' || incident.slaResolutionStatus === 'BREACHED';
  const slaStatusColor = isSlaBreached ? 'danger' : timeRemaining?.isOverdue ? 'danger' : 'success';

  // RBAC Checks
  const isAdmin = hasRole(USER_ROLES.ADMIN);
  const isResponder = hasRole(USER_ROLES.RESPONDER);
  // Check if current user is assigned or in assigned team (simplified check)
  const isAssigned = (incident.assignedTo && incident.assignedTo._id === user?._id);

  // Decide what actions to show
  const showAdminPanel = isAdmin;
  const showResponderActions = !isAdmin && (isResponder || isAssigned);
  const canDelete = isAdmin || (incident.reportedBy && user && incident.reportedBy._id === user._id);

  return (
    <Layout>
      <div className="incident-detail-page">
        {/* 2. Compact Header */}
        <div className="incident-header-compact">
          <div className="header-left">
            <Link to="/incidents" className="back-button">
              <FaArrowLeft />
            </Link>
            <span className="incident-id">{incident.incidentNumber}</span>
            <span className="incident-title-summary">{incident.title}</span>
            <div className="header-badges">
              <PriorityBadge priority={incident.priority} />
              {(isAdmin || isResponder) && (
                <select
                  value={incident.priority}
                  onChange={(e) => handlePriorityChange(e.target.value)}
                  className="priority-select-header"
                >
                  <option value="P0">P0</option>
                  <option value="P1">P1</option>
                  <option value="P2">P2</option>
                  <option value="P3">P3</option>
                </select>
              )}
              <StatusBadge status={incident.status} type="status" />
              <StatusBadge status={incident.severity} type="severity" />
            </div>
            <span className="service-tag">{incident.affectedService || 'General'}</span>
          </div>
          <div className="header-right">
            {canDelete && (
              <Button variant="danger" onClick={handleDelete} className="delete-btn">
                Delete Incident
              </Button>
            )}
          </div>
        </div>

        <div className="incident-detail-grid">
          {/* Main Content (70%) */}
          <div className="incident-main">

            {/* 3. Description & Core Details */}
            <div className="card-compact">
              <div className="card-header-dense">
                <h3 className="card-title-dense">Incident Description</h3>
                <span className="text-secondary text-sm">Created {formatDateTime(incident.createdAt)}</span>
              </div>
              <div className="card-body-dense">
                <p className="description-text">{incident.description}</p>

                <div className="details-grid">
                  <div className="detail-field">
                    <span className="detail-label">Reported By</span>
                    <span className="detail-value">{incident.reportedBy?.name || '—'}</span>
                  </div>
                  <div className="detail-field">
                    <span className="detail-label">Assigned Team</span>
                    <span className="detail-value">{incident.assignedTeam?.name || '—'}</span>
                  </div>
                  <div className="detail-field">
                    <span className="detail-label">Responder</span>
                    <span className="detail-value">{incident.assignedTo?.name || 'Unassigned'}</span>
                  </div>
                  <div className="detail-field">
                    <span className="detail-label">Last Updated</span>
                    <span className="detail-value">{formatDateTime(incident.updatedAt)}</span>
                  </div>
                  <div className="detail-field">
                    <span className="detail-label">Impacted Users</span>
                    <span className="detail-value">{incident.impactedUsers || '0'}</span>
                  </div>
                  <div className="detail-field">
                    <span className="detail-label">Criticality</span>
                    <span className="detail-value">{incident.businessCriticality || 'LOW'}</span>
                  </div>
                  {incident.priorityManuallyOverridden && (
                    <div className="detail-field">
                      <span className="detail-label">Priority Override</span>
                      <span className="detail-value text-warning">MANUAL</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 6. Activity Timeline Section */}
            <div>
              <div className="timeline-section-header">
                <h3 className="section-title"><FaHistory style={{ marginRight: '8px', opacity: 0.7 }} /> Activity Timeline</h3>
              </div>

              {/* Documents / Attachments */}
              <div style={{ marginBottom: '2rem' }}>
                <IncidentDocuments
                  incidentId={incident._id}
                  isResolved={incident.status === 'RESOLVED'}
                  canEdit={hasRole(USER_ROLES.ADMIN) || hasRole(USER_ROLES.RESPONDER)}
                />
              </div>

              {/* Comments */}
              <div style={{ marginBottom: '2rem' }}>
                <CommentSection
                  incidentId={incident._id}
                  onCommentAdded={handleIncidentUpdated}
                />
              </div>

              {/* Incident Timeline */}
              <div className="card-compact p-6">
                <IncidentTimeline
                  incidentId={incident._id}
                  refreshTrigger={incident}
                />
              </div>
            </div>
          </div>

          {/* Right Column (30%) - Sticky Sidebar */}
          <div className="incident-sidebar">

            {/* 4. Actions Panel */}
            {showAdminPanel && (
              <AdminOverridePanel
                incident={incident}
                onUpdate={handleIncidentUpdated}
              />
            )}

            {showResponderActions && (
              <IncidentActions
                incident={incident}
                onUpdate={handleIncidentUpdated}
              />
            )}

            {!showAdminPanel && !showResponderActions && (
              <div className="card-compact p-4 text-center text-secondary">
                <p className="text-sm">Read-only view</p>
              </div>
            )}

            {/* 5. SLA Visibility */}
            <div className="card-compact">
              <div className="card-header-dense">
                <h3 className="card-title-dense"><FaShieldAlt /> SLA Status</h3>
              </div>
              <div className="card-body-dense sla-card-content">

                {/* Resolution SLA */}
                <div className="sla-block">
                  <div className="sla-status-text" style={{ marginBottom: '4px' }}>
                    <span>Resolution Target</span>
                    <span className={`text-${incident.slaResolutionStatus === 'BREACHED' ? 'danger' : 'success'}`}>
                      {incident.slaResolutionStatus}
                    </span>
                  </div>
                  <div className="sla-bar-container">
                    <div
                      className={`sla-bar-fill ${incident.slaResolutionStatus === 'BREACHED' ? 'danger' : 'success'}`}
                      style={{
                        width: incident.slaResolutionStatus === 'MET' ? '100%' : '60%'
                      }}
                    ></div>
                  </div>
                </div>

                {/* Countdown Timer */}
                {incident.status !== 'RESOLVED' && incident.status !== 'CLOSED' && (
                  <div className="sla-timer">
                    <FaClock style={{ marginRight: '8px', opacity: 0.5 }} />
                    {timeRemaining?.text || '--:--'}
                  </div>
                )}

                <div className="text-xs text-secondary text-center">
                  Due: {incident.slaDeadline ? formatDateTime(incident.slaDeadline) : 'N/A'}
                </div>

              </div>
            </div>

            {/* Service & Impact Section */}
            {(incident.serviceId || incident.impactedServices?.length > 0) && (
              <div className="card-compact p-6 mb-6">
                <h4 className="detail-label mb-3 flex items-center gap-2">
                  <FaNetworkWired className="text-primary-color" /> Infrastructure Impact
                </h4>

                {incident.serviceId && (
                  <div className="mb-4">
                    <p className="text-xs text-secondary-color mb-1 uppercase tracking-wider font-bold">Affected Core Service</p>
                    <div className="flex items-center gap-2 p-2 bg-tertiary rounded border border-gray-700">
                      <FaTools className="text-warning-color text-xs" />
                      <span className="text-sm font-bold text-white">{incident.serviceId.name}</span>
                      <span className={`text-[10px] px-2 rounded-full ${incident.serviceId.status === 'DOWN' ? 'bg-danger text-white' : 'bg-warning text-black'}`}>
                        {incident.serviceId.status}
                      </span>
                    </div>
                  </div>
                )}

                {incident.impactedServices?.length > 0 && (
                  <div>
                    <p className="text-xs text-danger mb-1 uppercase tracking-wider font-bold">Downstream Impact</p>
                    <div className="flex flex-wrap gap-2">
                      {incident.impactedServices.map(s => (
                        <span key={s._id} className="text-[11px] bg-danger-subtle text-danger px-2 py-1 rounded border border-danger-subtle font-medium">
                          {s.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Escalation Status */}
            {incident.escalationStatus && (
              <div className="card-compact">
                <div className="card-header-dense">
                  <h3 className="card-title-dense"><FaLevelUpAlt /> Escalation</h3>
                  <span className={`escalation-badge level-${incident.escalationLevel}`}>
                    Level {incident.escalationLevel}
                  </span>
                </div>
                <div className="card-body-dense escalation-card-content">
                  <div className="esc-info-row">
                    <span className="esc-label">Status</span>
                    <span className={`esc-value status-${incident.escalationStatus.toLowerCase()}`}>
                      {incident.escalationStatus}
                    </span>
                  </div>

                  {incident.escalationStatus === 'ACTIVE' && incident.nextEscalationAt && (
                    <div className="esc-info-row">
                      <span className="esc-label">Next Threshold</span>
                      <span className="esc-value text-warning">
                        {formatDateTime(incident.nextEscalationAt)}
                      </span>
                    </div>
                  )}

                  {incident.lastEscalatedAt && (
                    <div className="esc-info-row">
                      <span className="esc-label">Last Escalated</span>
                      <span className="esc-value text-secondary">
                        {formatDateTime(incident.lastEscalatedAt)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Extra Metadata if needed */}
            {incident.additionalInfo && (
              <div className="card-compact">
                <div className="card-header-dense">
                  <h3 className="card-title-dense">Additional Info</h3>
                </div>
                <div className="card-body-dense">
                  <p className="text-sm">{incident.additionalInfo}</p>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </Layout>
  );
};

export default IncidentDetailPage;