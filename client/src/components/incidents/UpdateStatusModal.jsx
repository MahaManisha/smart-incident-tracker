import { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { updateIncidentStatus } from '../../api/incidentApi';
import { INCIDENT_STATUS } from '../../utils/constants';
import { toast } from 'react-toastify';

const UpdateStatusModal = ({ incident, isOpen, onClose, onSuccess }) => {
  const [status, setStatus] = useState(incident.status);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Determine available status transitions
  const getAvailableStatuses = () => {
    const currentStatus = incident.status;
    const statuses = [];

    switch (currentStatus) {
      case INCIDENT_STATUS.OPEN:
        statuses.push(INCIDENT_STATUS.ASSIGNED);
        break;
      case INCIDENT_STATUS.ASSIGNED:
        statuses.push(INCIDENT_STATUS.INVESTIGATING);
        break;
      case INCIDENT_STATUS.INVESTIGATING:
        statuses.push(INCIDENT_STATUS.RESOLVED);
        break;
      case INCIDENT_STATUS.RESOLVED:
        statuses.push(INCIDENT_STATUS.CLOSED, INCIDENT_STATUS.REOPENED);
        break;
      case INCIDENT_STATUS.CLOSED:
        statuses.push(INCIDENT_STATUS.REOPENED);
        break;
      case INCIDENT_STATUS.REOPENED:
        statuses.push(INCIDENT_STATUS.INVESTIGATING);
        break;
      default:
        break;
    }

    return statuses;
  };

  const availableStatuses = getAvailableStatuses();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (status === incident.status) {
      toast.error('Please select a different status');
      return;
    }

    try {
      setLoading(true);
      await updateIncidentStatus(incident._id, status, notes);
      toast.success('Status updated successfully');
      onSuccess();
    } catch (error) {
      toast.error(error.message || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Update Incident Status"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={loading}
            disabled={loading || status === incident.status}
          >
            Update Status
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Current Status</label>
          <p className="text-base text-semibold">{incident.status}</p>
        </div>

        <div className="form-group">
          <label htmlFor="status" className="form-label required">
            New Status
          </label>
          {availableStatuses.length === 0 ? (
            <p className="text-secondary">
              No status transitions available from {incident.status}
            </p>
          ) : (
            <select
              id="status"
              className="form-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              disabled={loading}
            >
              <option value={incident.status}>Select new status...</option>
              {availableStatuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="notes" className="form-label">
            Notes (optional)
          </label>
          <textarea
            id="notes"
            className="form-textarea"
            placeholder="Add any notes about this status change..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={loading}
            rows="4"
          />
        </div>

        {status === INCIDENT_STATUS.RESOLVED && (
          <div className="alert alert-success">
            <p>
              <strong>Resolution Notes:</strong> Please provide details about
              how the incident was resolved.
            </p>
          </div>
        )}
      </form>
    </Modal>
  );
};

export default UpdateStatusModal;