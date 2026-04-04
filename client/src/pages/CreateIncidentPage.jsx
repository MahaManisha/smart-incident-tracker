import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Layout from '../components/common/Layout';
import Button from '../components/common/Button';
import { createIncident, getKBSuggestions } from '../api/incidentApi';
import { validateIncidentForm } from '../utils/validators';
import { SEVERITY } from '../utils/constants';
import { toast } from 'react-toastify';
import PriorityBadge from '../components/common/PriorityBadge';
import TemplateSelector from '../components/incidents/TemplateSelector';
import { getServices, getImpactAnalysis } from '../api/mappingApi';
import { calculatePriority } from '../utils/priorityCalculator';
import { FaBook, FaSearch, FaChevronRight, FaServer } from 'react-icons/fa';
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
    serviceId: '',
    impactedUsers: '1',
    additionalInfo: '',
  });
  
  const [impactedServices, setImpactedServices] = useState([]);
  const [services, setServices] = useState([]);
  const [kbSuggestions, setKbSuggestions] = useState([]);
  const [kbLoading, setKbLoading] = useState(false);
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

  // KB Suggestion Logic (Debounced)
  useEffect(() => {
    if (formData.title.trim().length < 4) {
      setKbSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setKbLoading(true);
        const response = await getKBSuggestions(formData.title);
        if (response.success) {
          setKbSuggestions(response.incidents);
        }
      } catch (err) {
        console.error('KB fetch error');
      } finally {
        setKbLoading(false);
      }
    }, 600); // 600ms debounce

    return () => clearTimeout(timer);
  }, [formData.title]);

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

    const { isValid, errors: validationErrors } = validateIncidentForm(formData);
    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    try {
      setLoading(true);
      const data = await createIncident({
        ...formData,
        impactedUsers: formData.impactedUsers ? parseInt(formData.impactedUsers) : undefined,
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
          <h1 className="page-title">Create Intelligence Report</h1>
          <p className="page-description">Initialize incident tracking and decision support</p>
        </div>

        <div className="create-grid">
          <div className="form-column">
            <div className="form-card-premium">
              <TemplateSelector onSelect={handleTemplateSelect} />
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="title" className="form-label-premium required">Title</label>
                  <div className="input-with-icon">
                    <FaSearch className="input-icon" />
                    <input
                      type="text"
                      id="title"
                      name="title"
                      className={`form-input-premium ${errors.title ? 'error' : ''}`}
                      placeholder="e.g. Database connection timeouts in Production"
                      value={formData.title}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </div>
                  {errors.title && <span className="form-error">{errors.title}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="description" className="form-label-premium required">Situation Analysis</label>
                  <textarea
                    id="description"
                    name="description"
                    className={`form-textarea-premium ${errors.description ? 'error' : ''}`}
                    placeholder="Describe the symptoms and impact..."
                    value={formData.description}
                    onChange={handleChange}
                    disabled={loading}
                    rows="5"
                  />
                  {errors.description && <span className="form-error">{errors.description}</span>}
                </div>

                <div className="form-row-three">
                  <div className="form-group">
                    <label className="form-label-premium">Affected Service</label>
                    <select
                      id="serviceId"
                      name="serviceId"
                      className="form-select-premium"
                      value={formData.serviceId}
                      onChange={handleServiceChange}
                    >
                      <option value="">Infrastructure node...</option>
                      {services.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label-premium">Severity</label>
                    <select
                      id="severity"
                      name="severity"
                      className="form-select-premium"
                      value={formData.severity}
                      onChange={handleChange}
                    >
                      {Object.values(SEVERITY).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label-premium">Priority</label>
                    <div className="priority-preview-box">
                      <PriorityBadge priority={calculatedPriority} />
                    </div>
                  </div>
                </div>

                <div className="form-actions-premium">
                  <Button variant="secondary" onClick={() => navigate('/incidents')}>CANCEL</Button>
                  <Button type="submit" variant="primary" loading={loading} disabled={loading}>INITIALIZE INCIDENT</Button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column: Knowledge Suggestions */}
          <div className="kb-column">
            <div className="kb-suggestion-panel">
              <div className="kb-header">
                <FaBook className="text-secondary-color" />
                <h3>KNOWLEDGE SUGGESTIONS</h3>
              </div>
              
              <div className="kb-body">
                {kbLoading ? (
                  <div className="kb-loading-state">
                    <div className="scanline"></div>
                    <p>Scanning intelligence database...</p>
                  </div>
                ) : kbSuggestions.length > 0 ? (
                  <div className="kb-list animate-fade-in">
                    <p className="kb-instruction">Found {kbSuggestions.length} similar past incidents. These might contain a resolution:</p>
                    {kbSuggestions.map(inc => (
                      <div key={inc._id} className="kb-item-card">
                        <div className="kb-item-header">
                          <span className="kb-id">{inc.incidentNumber}</span>
                          <span className="kb-status">RESOLVED</span>
                        </div>
                        <h4 className="kb-title">{inc.title}</h4>
                        {inc.rootCause && (
                          <div className="kb-detail">
                            <strong>Root Cause:</strong> {inc.rootCause}
                          </div>
                        )}
                        <Link to={`/incidents/${inc._id}`} className="kb-view-link">
                          VIEW SOLUTION <FaChevronRight size={10} />
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : formData.title.length >= 4 ? (
                  <div className="kb-empty-state">
                    <p>No direct matches found in common knowledge base.</p>
                  </div>
                ) : (
                  <div className="kb-empty-state">
                    <p>Enter a title to see similar past resolutions.</p>
                  </div>
                )}
              </div>
              
              {impactedServices.length > 0 && (
                <div className="impact-blast-panel mt-6">
                  <div className="impact-header">
                    <FaServer className="text-danger-color" />
                    <h4>ESTIMATED BLAST RADIUS</h4>
                  </div>
                  <div className="impact-list">
                    {impactedServices.map(s => (
                      <div key={s._id} className="impact-node">
                        {s.name} <span className="crit-small">{s.criticality[0]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CreateIncidentPage;