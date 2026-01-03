import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/common/Layout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatusBadge from '../components/common/StatusBadge';
import Button from '../components/common/Button';
import { getAllIncidents } from '../api/incidentApi';
import { useAuth } from '../contexts/AuthContext';
import { USER_ROLES, INCIDENT_STATUS, SEVERITY } from '../utils/constants';
import { formatDateTime, formatRelativeTime } from '../utils/formatters';
import { toast } from 'react-toastify';
import './IncidentsPage.css';

const IncidentsPage = () => {
  const navigate = useNavigate();
  const { hasAnyRole } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    severity: '',
    search: '',
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
        ...(filters.search && { search: filters.search }),
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
            <p className="page-description">Manage and track all incidents</p>
          </div>
          {canCreateIncident && (
            <Button
              variant="primary"
              onClick={() => navigate('/incidents/create')}
            >
              ➕ Create Incident
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="filters-container">
          <div className="filter-group">
            <input
              type="text"
              className="form-input"
              placeholder="Search incidents..."
              value={filters.search}
              onChange={handleSearchChange}
            />
          </div>

          <div className="filter-group">
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

          <Button
            variant="secondary"
            onClick={() => {
              setFilters({ status: '', severity: '', search: '' });
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
          >
            Clear Filters
          </Button>
        </div>

        {/* Incidents Table */}
        {loading ? (
          <LoadingSpinner text="Loading incidents..." />
        ) : incidents.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <p className="empty-state-title">No incidents found</p>
            <p className="empty-state-description">
              {filters.search || filters.status || filters.severity
                ? 'Try adjusting your filters'
                : 'Create your first incident to get started'}
            </p>
            {canCreateIncident && (
              <Button
                variant="primary"
                onClick={() => navigate('/incidents/create')}
              >
                Create Incident
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Title</th>
                    <th>Severity</th>
                    <th>Status</th>
                    <th>Reporter</th>
                    <th>Responder</th>
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
                        <StatusBadge
                          status={incident.severity}
                          type="severity"
                        />
                      </td>
                      <td>
                        <StatusBadge status={incident.status} type="status" />
                      </td>
                      <td>{incident.reporter?.name || 'Unknown'}</td>
                      <td>{incident.responder?.name || '-'}</td>
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

            {/* Pagination */}
            {pagination.total > pagination.limit && (
              <div className="pagination">
                <button
                  className="pagination-button"
                  disabled={pagination.page === 1}
                  onClick={() =>
                    setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                  }
                >
                  Previous
                </button>
                <span className="pagination-info">
                  Page {pagination.page} of{' '}
                  {Math.ceil(pagination.total / pagination.limit)}
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
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default IncidentsPage;