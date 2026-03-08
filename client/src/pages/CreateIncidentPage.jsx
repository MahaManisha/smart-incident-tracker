import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/common/Layout';
import Button from '../components/common/Button';
import { createIncident } from '../api/incidentApi';
import { validateIncidentForm } from '../utils/validators';
import { SEVERITY } from '../utils/constants';
import { toast } from 'react-toastify';
import PriorityBadge from '../components/common/PriorityBadge';
import TemplateSelector from '../components/incidents/TemplateSelector';
import { getServices, getImpactAnalysis } from '../api/mappingApi';
import { calculatePriority } from '../utils/priorityCalculator';
import './CreateIncidentPage.css';

const CreateIncidentPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    type: 'OTHER',
    description: '',
    severity: 'MEDIUM',
    businessCriticality: 'LOW',
    affectedService: '',
    serviceId: '', // ✅ New field
    impactedUsers: '1',
    additionalInfo: '',
  });
  const [impactedServices, setImpactedServices] = useState([]);
  const [services, setServices] = useState([]);
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

  const handleTemplateSelect = (template) => {
    setFormData((prev) => ({
      ...prev,
      title: template.defaultTitle || prev.title,
      description: template.defaultIncidentDescription || prev.description,
      severity: template.defaultPriority === 'P0' ? 'HIGH' : (template.defaultPriority === 'P3' ? 'LOW' : 'MEDIUM'),
      businessCriticality: template.defaultBusinessCriticality || prev.businessCriticality,
      additionalInfo: template.defaultTags && template.defaultTags.length > 0
        ? `Tags: ${template.defaultTags.join(', ')}`
        : prev.additionalInfo
    }));
    toast.info(`Applied template: ${template.name}`);
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

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const data = await getServices();
        setServices(data);
      } catch (err) {
        console.error('Failed to load services');
      }
    };
    fetchServices();
  }, []);

  const handleServiceChange = async (e) => {
    const serviceId = e.target.value;
    setFormData(prev => ({ ...prev, serviceId }));

    if (serviceId) {
      try {
        const impacted = await getImpactAnalysis(serviceId);
        setImpactedServices(impacted);

        // Auto-set affectedService text name if needed
        const service = services.find(s => s._id === serviceId);
        if (service) {
          setFormData(prev => ({ ...prev, affectedService: service.name }));
        }
      } catch (err) {
        console.error('Impact analysis failed');
      }
    } else {
      setImpactedServices([]);
    }
  };

  const calculatedPriority = calculatePriority(
    formData.impactedUsers,
    formData.businessCriticality
  ).priority;

  return (
    <Layout>
      <div className="create-incident-page">
        <div className="page-header">
          <h1 className="page-title">Create New Incident</h1>
          <p className="page-description">Report a new incident or issue</p>
        </div>

        <div className="form-card">
          <TemplateSelector onSelect={handleTemplateSelect} />
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
                <label htmlFor="type" className="form-label required">
                  Type
                </label>
                <select
                  id="type"
                  name="type"
                  className="form-select"
                  value={formData.type}
                  onChange={handleChange}
                  disabled={loading}
                >
                  <option value="SECURITY">Security</option>
                  <option value="NETWORK">Network</option>
                  <option value="HARDWARE">Hardware</option>
                  <option value="SOFTWARE">Software</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="serviceId" className="form-label">
                  Affected Service (Assets)
                </label>
                <select
                  id="serviceId"
                  name="serviceId"
                  className="form-select border-primary"
                  value={formData.serviceId}
                  onChange={handleServiceChange}
                  disabled={loading}
                >
                  <option value="">Select infrastructure service...</option>
                  {services.map(s => (
                    <option key={s._id} value={s._id}>{s.name} ({s.status})</option>
                  ))}
                </select>
                {impactedServices.length > 0 && (
                  <div className="impact-preview mt-2 p-2 bg-danger-subtle rounded border border-danger-subtle">
                    <p className="text-xs font-bold text-danger">⚠️ Potential Impact Detected:</p>
                    <p className="text-[10px] text-danger-color">
                      {impactedServices.map(s => s.name).join(', ')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="form-row">
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
                  min="1"
                />
              </div>

              <div className="form-group">
                <label htmlFor="businessCriticality" className="form-label">
                  Business Criticality
                </label>
                <select
                  id="businessCriticality"
                  name="businessCriticality"
                  className="form-select"
                  value={formData.businessCriticality}
                  onChange={handleChange}
                  disabled={loading}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Calculated Priority</label>
                <div style={{ padding: '0.4rem 0' }}>
                  <PriorityBadge priority={calculatedPriority} />
                </div>
              </div>
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