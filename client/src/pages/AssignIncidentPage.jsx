import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/common/Layout';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatusBadge from '../components/common/StatusBadge';
import Select from '../components/common/Select';
import { getUnassignedIncidents, assignIncident } from '../api/incidentApi';
import { getResponders } from '../api/userApi';
import { formatDateTime, formatUserName } from '../utils/formatters';
import { toast } from 'react-toastify';
import './AssignIncidentPage.css';

const AssignIncidentPage = () => {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState([]);
  const [responders, setResponders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigningId, setAssigningId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch both unassigned incidents and responders
      const [incidentsData, respondersData] = await Promise.all([
        getUnassignedIncidents(),
        getResponders()
      ]);

      setIncidents(incidentsData.incidents || []);
      setResponders(respondersData.data || []);
    } catch (error) {
      toast.error(error.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (incidentId, responderId) => {
    if (!responderId) {
      toast.error('Please select a responder');
      return;
    }

    setAssigningId(incidentId);

    try {
      await assignIncident(incidentId, responderId);
      toast.success('Incident assigned successfully');
      
      // Refresh the list
      await fetchData();
    } catch (error) {
      toast.error(error.message || 'Failed to assign incident');
    } finally {
      setAssigningId(null);
    }
  };

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner size="lg" text="Loading unassigned incidents..." />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="assign-incident-page">
        <div className="page-header">
          <div>
            <h1 className="page-title">Assign Incidents</h1>
            <p className="page-description">
              Assign responders to open incidents
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={() => navigate('/incidents')}
          >
            ← Back to Incidents
          </Button>
        </div>

        {incidents.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-title">No unassigned incidents</p>
            <p className="empty-state-text">
              All incidents have been assigned or there are no open incidents.
            </p>
          </div>
        ) : (
          <div className="incidents-table-container">
            <table className="incidents-table">
              <thead>
                <tr>
                  <th>Incident #</th>
                  <th>Title</th>
                  <th>Severity</th>
                  <th>Reporter</th>
                  <th>Reported</th>
                  <th>Assign To</th>
                </tr>
              </thead>
              <tbody>
                {incidents.map((incident) => (
                  <IncidentRow
                    key={incident._id}
                    incident={incident}
                    responders={responders}
                    onAssign={handleAssign}
                    isAssigning={assigningId === incident._id}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
};

const IncidentRow = ({ incident, responders, onAssign, isAssigning }) => {
  const [selectedResponder, setSelectedResponder] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onAssign(incident._id, selectedResponder);
  };

  return (
    <tr>
      <td>
        <span className="incident-number">{incident.incidentNumber}</span>
      </td>
      <td>
        <div className="incident-title-cell">
          <span className="incident-title">{incident.title}</span>
          <span className="incident-description">
            {incident.description.substring(0, 80)}
            {incident.description.length > 80 && '...'}
          </span>
        </div>
      </td>
      <td>
        <StatusBadge status={incident.severity} type="severity" />
      </td>
      <td>
        <div className="reporter-cell">
          <span className="reporter-name">
            {/* ✅ FIXED: Now shows reporter correctly */}
            {formatUserName(incident.reportedBy)}
          </span>
          <span className="reporter-email">
            {incident.reportedBy?.email}
          </span>
        </div>
      </td>
      <td>
        <span className="date-cell">{formatDateTime(incident.createdAt)}</span>
      </td>
      <td>
        <form onSubmit={handleSubmit} className="assign-form">
          <Select
            value={selectedResponder}
            onChange={(e) => setSelectedResponder(e.target.value)}
            disabled={isAssigning}
            required
          >
            <option value="">Select Responder...</option>
            {responders.map((responder) => (
              <option key={responder._id} value={responder._id}>
                {responder.name}
              </option>
            ))}
          </Select>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            loading={isAssigning}
            disabled={isAssigning || !selectedResponder}
          >
            {isAssigning ? 'Assigning...' : 'Assign'}
          </Button>
        </form>
      </td>
    </tr>
  );
};

export default AssignIncidentPage;