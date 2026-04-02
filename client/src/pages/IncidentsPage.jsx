import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/common/Layout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatusBadge from '../components/common/StatusBadge';
import Button from '../components/common/Button';
import PriorityBadge from '../components/common/PriorityBadge';
import { getAllIncidents } from '../api/incidentApi';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { USER_ROLES, INCIDENT_STATUS, SEVERITY } from '../utils/constants';
import { formatDateTime, formatRelativeTime } from '../utils/formatters';
import { toast } from 'react-toastify';
import { 
  FaSearch, FaFilter, FaPlus, FaCalendarAlt, FaSortAmountDown, 
  FaExclamationTriangle, FaShieldAlt, FaUser, FaClock, FaHashtag, FaTag
} from 'react-icons/fa';
import './IncidentsPage.css';

const IncidentsPage = () => {
  const navigate = useNavigate();
  const { hasAnyRole } = useAuth();
  const { settings } = useSettings();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    severity: '',
    priority: '',
    type: '',
    search: '',
    startDate: '',
    endDate: '',
    sortBy: 'createdAt',
    order: 'desc'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
  });

  useEffect(() => {
    fetchIncidents();
  }, [filters, pagination.page]);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...(filters.status && { status: filters.status }),
        ...(filters.severity && { severity: filters.severity }),
        ...(filters.priority && { priority: filters.priority }),
        ...(filters.type && { type: filters.type }),
        ...(filters.search && { search: filters.search }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        sortBy: filters.sortBy,
        order: filters.order
      };

      const data = await getAllIncidents(params);
      setIncidents(data.incidents || []);
      setPagination((prev) => ({
        ...prev,
        total: data.total || 0,
      }));
    } catch (error) {
      toast.error(error.message || 'Failed to load incidents');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setFilters((prev) => ({ ...prev, search: value }));
  };

  const handleIncidentClick = (id) => {
    navigate(`/incidents/${id}`);
  };

  const canCreateIncident = hasAnyRole([USER_ROLES.ADMIN, USER_ROLES.REPORTER]);

  return (
    <Layout>
      <div className="incidents-page">
        <div className="page-header">
          <div>
            <h1 className="page-title">Incidents</h1>
            <p className="page-description">Real-time status and lifecycle management of system incidents</p>
          </div>
          {canCreateIncident && (
            <Button
              variant="primary"
              onClick={() => navigate('/incidents/create')}
              className="btn-primary"
            >
              <FaPlus className="btn-icon" /> Create Incident
            </Button>
          )}
        </div>

        {/* Professional Filters */}
        <div className="filters-container">
          <div className="filter-group">
            <FaSearch className="filter-icon" />
            <input
              type="text"
              className="form-input"
              placeholder="Search ID, title..."
              value={filters.search}
              onChange={handleSearchChange}
            />
          </div>

          <div className="filter-group">
            <FaTag className="filter-icon" />
            <select
              className="form-select"
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
            >
              <option value="">All Types</option>
              {["SECURITY", "NETWORK", "HARDWARE", "SOFTWARE", "OTHER"].map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <FaFilter className="filter-icon" />
            <select
              className="form-select"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">All Statuses</option>
              {Object.values(INCIDENT_STATUS).map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <FaExclamationTriangle className="filter-icon" />
            <select
              className="form-select"
              value={filters.severity}
              onChange={(e) => handleFilterChange('severity', e.target.value)}
            >
              <option value="">All Severities</option>
              {Object.values(SEVERITY).map((severity) => (
                <option key={severity} value={severity}>
                  {severity}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <FaSortAmountDown className="filter-icon" />
            <select
              className="form-select"
              value={`${filters.sortBy}-${filters.order}`}
              onChange={(e) => {
                const [sortBy, order] = e.target.value.split('-');
                setFilters(prev => ({ ...prev, sortBy, order }));
              }}
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="priority-asc">Priority (High-Low)</option>
            </select>
          </div>

          <Button
            variant="secondary"
            onClick={() => {
              setFilters({ status: '', severity: '', priority: '', search: '', type: '', startDate: '', endDate: '', sortBy: 'createdAt', order: 'desc' });
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
          >
            Reset
          </Button>
        </div>

        {/* Incidents Data View */}
        {
          loading ? (
            <LoadingSpinner text="Synchronizing incidents..." />
          ) : incidents.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><FaExclamationTriangle /></div>
              <p className="empty-state-title">No Incidents Found</p>
              <p className="empty-state-description">
                {filters.search || filters.status || filters.severity
                  ? 'Adjust your global filters to see more results'
                  : 'Your dashboard is clean. No incidents recorded yet.'}
              </p>
              {canCreateIncident && (
                <Button
                  variant="primary"
                  onClick={() => navigate('/incidents/create')}
                >
                  Create Your First Incident
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th><FaHashtag style={{ marginRight: '8px' }} />ID</th>
                      <th>Title</th>
                      <th><FaShieldAlt style={{ marginRight: '8px' }} />Severity</th>
                      <th>Priority</th>
                      <th>Level</th>
                      <th>Status</th>
                      <th><FaUser style={{ marginRight: '8px' }} />Reporter</th>
                      <th>Responder</th>
                      <th><FaClock style={{ marginRight: '8px' }} />Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incidents.map((incident) => (
                      <tr
                        key={incident._id}
                        onClick={() => handleIncidentClick(incident._id)}
                      >
                        <td>
                          <span className="incident-number">
                            #{incident.incidentNumber}
                          </span>
                        </td>
                        <td>
                          <span className="incident-title">{incident.title}</span>
                        </td>
                        <td>
                          <StatusBadge status={incident.severity} type="severity" />
                        </td>
                        <td>
                          <PriorityBadge priority={incident.priority} />
                        </td>
                        <td>
                          <span className={`escalation-badge level-${incident.escalationLevel}`}>
                            L{incident.escalationLevel || 1}
                          </span>
                        </td>
                        <td>
                          <StatusBadge status={incident.status} type="status" />
                        </td>
                        <td>{incident.reportedBy?.name || '---'}</td>
                        <td>{incident.assignedTo?.name || '---'}</td>
                        <td>
                          <span
                            className="incident-time"
                            title={formatDateTime(incident.createdAt)}
                          >
                            {formatRelativeTime(incident.createdAt)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Section */}
              {pagination.total > pagination.limit && (
                <div className="pagination">
                  <button
                    className="pagination-button"
                    disabled={pagination.page === 1}
                    onClick={() =>
                      setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                    }
                  >
                    Previous Page
                  </button>
                  <span className="pagination-info">
                    {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}
                  </span>
                  <button
                    className="pagination-button"
                    disabled={
                      pagination.page >=
                      Math.ceil(pagination.total / pagination.limit)
                    }
                    onClick={() =>
                      setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                    }
                  >
                    Next Page
                  </button>
                </div>
              )}
            </>
          )
        }
      </div >
    </Layout >
  );
};

export default IncidentsPage;