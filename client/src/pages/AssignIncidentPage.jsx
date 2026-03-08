import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/common/Layout';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatusBadge from '../components/common/StatusBadge';
import Select from '../components/common/Select';
import { getUnassignedIncidents, assignIncident } from '../api/incidentApi';
import { getResponders } from '../api/userApi';
import { getAllTeams } from '../api/teamsApi';
import { formatDateTime, formatUserName } from '../utils/formatters';
import { toast } from 'react-toastify';
import { FaArrowLeft, FaUser, FaUsers } from 'react-icons/fa';
import './AssignIncidentPage.css';

const AssignIncidentPage = () => {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState([]);
  const [responders, setResponders] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigningId, setAssigningId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch both unassigned incidents and responders and teams
      const [incidentsData, respondersData, teamsData] = await Promise.all([
        getUnassignedIncidents(),
        getResponders(),
        getAllTeams()
      ]);

      setIncidents(incidentsData.incidents || []);
      setResponders(respondersData.data || []);
      setTeams(teamsData.teams || []);
    } catch (error) {
      toast.error(error.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (incidentId, assignmentData) => {
    if (!assignmentData.responderId && !assignmentData.teamId) {
      toast.error('Please select a responder or team');
      return;
    }

    setAssigningId(incidentId);

    try {
      await assignIncident(incidentId, assignmentData);
      toast.success('Incident assigned successfully');
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
            <FaArrowLeft style={{ marginRight: '8px' }} /> Back to Incidents
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
                    teams={teams}
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

const IncidentRow = ({ incident, responders, teams, onAssign, isAssigning }) => {
  const [assignType, setAssignType] = useState('USER'); // 'USER' or 'TEAM'
  const [selectedId, setSelectedId] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (assignType === 'USER') {
      onAssign(incident._id, { responderId: selectedId });
    } else {
      onAssign(incident._id, { teamId: selectedId });
    }
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
          <div className="assign-type-toggle">
            <button
              type="button"
              className={`toggle-btn ${assignType === 'USER' ? 'active' : ''}`}
              onClick={() => { setAssignType('USER'); setSelectedId(''); }}
              title="Assign to Responder"
            >
              <FaUser />
            </button>
            <button
              type="button"
              className={`toggle-btn ${assignType === 'TEAM' ? 'active' : ''}`}
              onClick={() => { setAssignType('TEAM'); setSelectedId(''); }}
              title="Assign to Team"
            >
              <FaUsers />
            </button>
          </div>

          <Select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            disabled={isAssigning}
            required
            className="assign-select"
          >
            <option value="">Select {assignType === 'USER' ? 'Responder' : 'Team'}...</option>
            {assignType === 'USER'
              ? responders.map((responder) => (
                <option key={responder._id} value={responder._id}>
                  {responder.name}
                </option>
              ))
              : teams.map((team) => (
                <option key={team._id} value={team._id}>
                  {team.name}
                </option>
              ))
            }
          </Select>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            loading={isAssigning}
            disabled={isAssigning || !selectedId}
          >
            {isAssigning ? '...' : 'Assign'}
          </Button>
        </form>
      </td>
    </tr>
  );
};

export default AssignIncidentPage;