import { useState } from 'react';
import Button from '../common/Button';
import Modal from '../common/Modal';
import AssignModal from './AssignModal';
import UpdateStatusModal from './UpdateStatusModal';
import { useAuth } from '../../contexts/AuthContext';
import { USER_ROLES, INCIDENT_STATUS } from '../../utils/constants';
import './IncidentActions.css';

const IncidentActions = ({ incident, onUpdate }) => {
  const { hasRole } = useAuth();
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  const isAdmin = hasRole(USER_ROLES.ADMIN);
  const canAssign = isAdmin && incident.status === INCIDENT_STATUS.OPEN;
  const canUpdateStatus =
    isAdmin ||
    (incident.responder &&
      [
        INCIDENT_STATUS.ASSIGNED,
        INCIDENT_STATUS.INVESTIGATING,
        INCIDENT_STATUS.RESOLVED,
      ].includes(incident.status));

  return (
    <div className="incident-actions-card card">
      <div className="card-header">
        <h3 className="card-title">Actions</h3>
      </div>
      <div className="card-body">
        <div className="action-buttons">
          {canAssign && (
            <Button
              variant="primary"
              fullWidth
              onClick={() => setShowAssignModal(true)}
            >
              👤 Assign Responder
            </Button>
          )}

          {canUpdateStatus && (
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setShowStatusModal(true)}
            >
              📝 Update Status
            </Button>
          )}

          {incident.status === INCIDENT_STATUS.RESOLVED && (
            <Button variant="success" fullWidth onClick={() => {}}>
              ✓ Close Incident
            </Button>
          )}
        </div>
      </div>

      {/* Assign Modal */}
      {showAssignModal && (
        <AssignModal
          incident={incident}
          isOpen={showAssignModal}
          onClose={() => setShowAssignModal(false)}
          onSuccess={() => {
            setShowAssignModal(false);
            onUpdate();
          }}
        />
      )}

      {/* Update Status Modal */}
      {showStatusModal && (
        <UpdateStatusModal
          incident={incident}
          isOpen={showStatusModal}
          onClose={() => setShowStatusModal(false)}
          onSuccess={() => {
            setShowStatusModal(false);
            onUpdate();
          }}
        />
      )}
    </div>
  );
};

export default IncidentActions;