import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/common/Layout';
import Button from '../components/common/Button';
import { createIncident } from '../api/incidentApi';
import { validateIncidentForm } from '../utils/validators';
import { SEVERITY } from '../utils/constants';
import { toast } from 'react-toastify';
import './CreateIncidentPage.css';

const CreateIncidentPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    severity: 'MEDIUM',
    affectedService: '',
    impactedUsers: '',
    additionalInfo: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    const { isValid, errors: validationErrors } =
      validateIncidentForm(formData);
    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    try {
      setLoading(true);
      const data = await createIncident({
        ...formData,
        impactedUsers: formData.impactedUsers
          ? parseInt(formData.impactedUsers)
          : undefined,
      });
      toast.success('Incident created successfully');
      navigate(`/incidents/${data.incident._id}`);
    } catch (error) {
      toast.error(error.message || 'Failed to create incident');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="create-incident-page">
        <div className="page-header">
          <h1 className="page-title">Create New Incident</h1>
          <p className="page-description">Report a new incident or issue</p>
        </div>

        <div className="form-card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="title" className="form-label required">
                Title
              </label>
              <input
                type="text"
                id="title"
                name="title"
                className={`form-input ${errors.title ? 'error' : ''}`}
                placeholder="Brief description of the incident"
                value={formData.title}
                onChange={handleChange}
                disabled={loading}
              />
              {errors.title && (
                <span className="form-error">{errors.title}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="description" className="form-label required">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                className={`form-textarea ${errors.description ? 'error' : ''}`}
                placeholder="Detailed description of the incident"
                value={formData.description}
                onChange={handleChange}
                disabled={loading}
                rows="6"
              />
              {errors.description && (
                <span className="form-error">{errors.description}</span>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="severity" className="form-label required">
                  Severity
                </label>
                <select
                  id="severity"
                  name="severity"
                  className={`form-select ${errors.severity ? 'error' : ''}`}
                  value={formData.severity}
                  onChange={handleChange}
                  disabled={loading}
                >
                  {Object.values(SEVERITY).map((severity) => (
                    <option key={severity} value={severity}>
                      {severity}
                    </option>
                  ))}
                </select>
                {errors.severity && (
                  <span className="form-error">{errors.severity}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="affectedService" className="form-label">
                  Affected Service
                </label>
                <input
                  type="text"
                  id="affectedService"
                  name="affectedService"
                  className="form-input"
                  placeholder="e.g., Database, API, Web Server"
                  value={formData.affectedService}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="impactedUsers" className="form-label">
                Impacted Users (estimate)
              </label>
              <input
                type="number"
                id="impactedUsers"
                name="impactedUsers"
                className="form-input"
                placeholder="Number of users affected"
                value={formData.impactedUsers}
                onChange={handleChange}
                disabled={loading}
                min="0"
              />
            </div>

            <div className="form-group">
              <label htmlFor="additionalInfo" className="form-label">
                Additional Information
              </label>
              <textarea
                id="additionalInfo"
                name="additionalInfo"
                className="form-textarea"
                placeholder="Any additional context or information"
                value={formData.additionalInfo}
                onChange={handleChange}
                disabled={loading}
                rows="4"
              />
            </div>

            <div className="form-actions">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/incidents')}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={loading}
                disabled={loading}
              >
                Create Incident
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default CreateIncidentPage;