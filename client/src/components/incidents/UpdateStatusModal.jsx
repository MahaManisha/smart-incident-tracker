import { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { updateIncidentStatus } from '../../api/incidentApi';
import { INCIDENT_STATUS } from '../../utils/constants';
import { toast } from 'react-toastify';
import { FaSkull, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

const UpdateStatusModal = ({ incident, isOpen, onClose, onSuccess }) => {
  const [status, setStatus] = useState(incident.status);
  const [notes, setNotes] = useState('');
  const [rootCause, setRootCause] = useState(incident.rootCause || '');
  const [resolutionNotes, setResolutionNotes] = useState(incident.resolutionNotes || '');
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

    if (status === INCIDENT_STATUS.RESOLVED) {
      if (!rootCause || !resolutionNotes) {
        toast.error('Root Cause and Resolution Summary are mandatory for KB storage');
        return;
      }
    }

    try {
      setLoading(true);
      await updateIncidentStatus(incident._id, status, notes, rootCause, resolutionNotes);
      toast.success('Status updated and Knowledge Base populated');
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
      title="Intelligence Status Update"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant={status === INCIDENT_STATUS.RESOLVED ? "success" : "primary"}
            onClick={handleSubmit}
            loading={loading}
            disabled={loading || status === incident.status}
          >
            {status === INCIDENT_STATUS.RESOLVED ? "RESOLVE & STORE KB" : "Update Status"}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex justify-between items-center bg-slate-900/50 p-3 border border-slate-700/30 rounded mb-4">
          <div className="text-xs">
            <span className="text-slate-500 uppercase tracking-widest font-bold">Current</span>
            <div className="font-bold text-slate-200 mt-1">{incident.status}</div>
          </div>
          <div className="text-slate-600">→</div>
          <div className="text-xs text-right">
             <span className="text-primary-color uppercase tracking-widest font-bold">Next</span>
             <div className="font-bold text-white mt-1 uppercase">{status || '...'}</div>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="status" className="form-label-premium required">
            Target Status
          </label>
          <select
            id="status"
            className="form-select-premium"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            disabled={loading}
          >
            <option value={incident.status}>Select transition...</option>
            {availableStatuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {status === INCIDENT_STATUS.RESOLVED ? (
          <div className="kb-capture-area animate-fade-in space-y-4 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded">
             <div className="flex items-center gap-2 text-emerald-500 font-bold text-sm mb-2 uppercase tracking-wide">
                <FaCheckCircle /> Knowledge Base Acquisition
             </div>
             
             <div className="form-group">
                <label className="form-label-premium required text-emerald-400/80"><FaSkull size={10} className="mr-1" /> Confirmed Root Cause</label>
                <input 
                  type="text" 
                  className="form-input-premium border-emerald-500/30 focus:border-emerald-500" 
                  placeholder="e.g. Memory leak in high-traffic microservice"
                  value={rootCause}
                  onChange={(e) => setRootCause(e.target.value)}
                />
             </div>

             <div className="form-group">
                <label className="form-label-premium required text-emerald-400/80">Resolution Summary (Fix)</label>
                <textarea 
                  className="form-textarea-premium border-emerald-500/30 focus:border-emerald-500" 
                  rows="3"
                  placeholder="Describe how the issue was mitigated and fixed..."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                />
             </div>
          </div>
        ) : (
          <div className="form-group">
            <label htmlFor="notes" className="form-label-premium">
              Audit Notes
            </label>
            <textarea
              id="notes"
              className="form-textarea-premium"
              placeholder="Internal tracking notes (optional)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={loading}
              rows="3"
            />
          </div>
        )}
      </form>
    </Modal>
  );
};

export default UpdateStatusModal;