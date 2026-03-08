import { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { getResponders } from '../../api/userApi';
import { assignIncident } from '../../api/incidentApi';
import { toast } from 'react-toastify';

const AssignModal = ({ incident, isOpen, onClose, onSuccess }) => {
  const [responders, setResponders] = useState([]);
  const [selectedResponder, setSelectedResponder] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingResponders, setFetchingResponders] = useState(true);

  useEffect(() => {
    fetchResponders();
  }, []);

  const fetchResponders = async () => {
    try {
      setFetchingResponders(true);
      const data = await getResponders();
      setResponders(data.users || []);
    } catch (error) {
      toast.error('Failed to load responders');
    } finally {
      setFetchingResponders(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedResponder) {
      toast.error('Please select a responder');
      return;
    }

    try {
      setLoading(true);
      await assignIncident(incident._id, selectedResponder);
      toast.success('Incident assigned successfully');
      onSuccess();
    } catch (error) {
      toast.error(error.message || 'Failed to assign incident');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Assign Incident"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={loading}
            disabled={loading || !selectedResponder}
          >
            Assign
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="responder" className="form-label required">
            Select Responder
          </label>
          {fetchingResponders ? (
            <p className="text-secondary">Loading responders...</p>
          ) : responders.length === 0 ? (
            <p className="text-secondary">No responders available</p>
          ) : (
            <select
              id="responder"
              className="form-select"
              value={selectedResponder}
              onChange={(e) => setSelectedResponder(e.target.value)}
              disabled={loading}
            >
              <option value="">Choose a responder...</option>
              {responders.map((responder) => (
                <option key={responder._id} value={responder._id}>
                  {responder.name} ({responder.email})
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="alert alert-info">
          <p>
            The selected responder will be notified via email and in-app
            notification.
          </p>
        </div>
      </form>
    </Modal>
  );
};

export default AssignModal;