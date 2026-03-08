import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Button from '../../components/common/Button';
import { getIncidentById, createIncidentDocumentation } from '../../api/incidentApi';
import { useAuth } from '../../contexts/AuthContext';
import { USER_ROLES } from '../../utils/constants';
import { toast } from 'react-toastify';
import './IncidentDocumentation.css';

const IncidentDocumentation = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    rootCause: '',
    resolutionSteps: '',
    preventionMeasures: '',
  });

  const [files, setFiles] = useState([]);

  useEffect(() => {
    fetchIncident();
  }, [id]);

  const fetchIncident = async () => {
    try {
      setLoading(true);
      const data = await getIncidentById(id);
      const fetchedIncident = data.incident;

      // Access Control: Only ADMIN and RESPONDER can access
      if (!hasRole(USER_ROLES.ADMIN) && !hasRole(USER_ROLES.RESPONDER)) {
        toast.error('You do not have permission to add documentation');
        navigate(`/incidents/${id}`);
        return;
      }

      // Incident must be RESOLVED
      if (fetchedIncident.status !== 'RESOLVED') {
        toast.error('Documentation can only be added to resolved incidents');
        navigate(`/incidents/${id}`);
        return;
      }

      setIncident(fetchedIncident);
    } catch (error) {
      toast.error(error.message || 'Failed to load incident');
      navigate('/incidents');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    
    // Validate file types
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'video/mp4',
      'video/mpeg',
      'video/quicktime',
    ];

    const invalidFiles = selectedFiles.filter(
      (file) => !allowedTypes.includes(file.type)
    );

    if (invalidFiles.length > 0) {
      toast.error('Only PDF, images (JPEG, PNG, GIF), and videos (MP4, MPEG, MOV) are allowed');
      return;
    }

    // Validate file size (max 10MB per file)
    const maxSize = 10 * 1024 * 1024; // 10MB
    const oversizedFiles = selectedFiles.filter((file) => file.size > maxSize);

    if (oversizedFiles.length > 0) {
      toast.error('Each file must be less than 10MB');
      return;
    }

    setFiles((prev) => [...prev, ...selectedFiles]);
  };

  const handleRemoveFile = (indexToRemove) => {
    setFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.rootCause.trim()) {
      toast.error('Root Cause Analysis is required');
      return;
    }

    if (!formData.resolutionSteps.trim()) {
      toast.error('Resolution Steps are required');
      return;
    }

    if (!formData.preventionMeasures.trim()) {
      toast.error('Prevention Measures are required');
      return;
    }

    try {
      setSubmitting(true);

      // Create FormData for multipart/form-data
      const formDataToSend = new FormData();
      formDataToSend.append('rootCause', formData.rootCause);
      formDataToSend.append('resolutionSteps', formData.resolutionSteps);
      formDataToSend.append('preventionMeasures', formData.preventionMeasures);

      // Append files
      files.forEach((file) => {
        formDataToSend.append('files', file);
      });

      // Submit documentation
      await createIncidentDocumentation(id, formDataToSend);

      toast.success('Documentation added successfully');
      navigate(`/incidents/${id}`);
    } catch (error) {
      toast.error(error.message || 'Failed to submit documentation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(`/incidents/${id}`);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.startsWith('video/')) return '🎥';
    if (fileType === 'application/pdf') return '📄';
    return '📎';
  };

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner size="lg" text="Loading incident..." />
      </Layout>
    );
  }

  if (!incident) {
    return (
      <Layout>
        <div className="empty-state">
          <p className="empty-state-title">Incident not found</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="documentation-page">
        <div className="page-header">
          <div>
            <h1 className="page-title">Add Post-Incident Documentation</h1>
            <p className="page-description">
              Document root cause, resolution steps, and prevention measures for{' '}
              <strong>{incident.incidentNumber}</strong>
            </p>
          </div>
          <Button variant="secondary" onClick={handleCancel}>
            ← Cancel
          </Button>
        </div>

        <div className="documentation-container">
          <div className="incident-summary-card">
            <h3>Incident Summary</h3>
            <div className="summary-details">
              <div className="summary-item">
                <span className="summary-label">Incident ID:</span>
                <span className="summary-value">{incident.incidentNumber}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Title:</span>
                <span className="summary-value">{incident.title}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Severity:</span>
                <span className={`summary-badge severity-${incident.severity.toLowerCase()}`}>
                  {incident.severity}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Status:</span>
                <span className="summary-badge status-resolved">RESOLVED</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="documentation-form">
            {/* Root Cause Analysis */}
            <div className="form-section">
              <label className="form-label required">
                🔍 Root Cause Analysis
              </label>
              <p className="form-hint">
                Describe what caused this incident and why it happened
              </p>
              <textarea
                name="rootCause"
                value={formData.rootCause}
                onChange={handleInputChange}
                className="form-textarea"
                rows="6"
                placeholder="Example: The application's database connection pool was configured with a maximum of 20 connections, which was insufficient during peak traffic hours..."
                required
              />
            </div>

            {/* Resolution Steps */}
            <div className="form-section">
              <label className="form-label required">
                🔧 Resolution Steps
              </label>
              <p className="form-hint">
                List the steps taken to resolve this incident (one per line or numbered)
              </p>
              <textarea
                name="resolutionSteps"
                value={formData.resolutionSteps}
                onChange={handleInputChange}
                className="form-textarea"
                rows="8"
                placeholder="Example:
1. Identified the issue through monitoring alerts
2. Temporarily increased max connections to 50
3. Deployed emergency patch to fix connection leak
4. Verified connection release through load testing"
                required
              />
            </div>

            {/* Prevention Measures */}
            <div className="form-section">
              <label className="form-label required">
                🛡️ Prevention Measures
              </label>
              <p className="form-hint">
                List actions to prevent similar incidents in the future
              </p>
              <textarea
                name="preventionMeasures"
                value={formData.preventionMeasures}
                onChange={handleInputChange}
                className="form-textarea"
                rows="6"
                placeholder="Example:
- Implement connection pool monitoring with alerts
- Add automated tests for connection lifecycle
- Establish connection pool sizing guidelines
- Schedule quarterly review of metrics"
                required
              />
            </div>

            {/* File Upload */}
            <div className="form-section">
              <label className="form-label">
                📎 Attachments (Optional)
              </label>
              <p className="form-hint">
                Upload supporting files (PDF, images, videos) - Max 10MB per file
              </p>
              
              <div className="file-upload-container">
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.gif,.mp4,.mpeg,.mov"
                  onChange={handleFileChange}
                  className="file-input-hidden"
                />
                <label htmlFor="file-upload" className="file-upload-label">
                  <span className="upload-icon">📁</span>
                  <span>Choose Files</span>
                </label>
                <p className="file-upload-note">
                  Accepted: PDF, JPEG, PNG, GIF, MP4, MPEG, MOV
                </p>
              </div>

              {/* Selected Files List */}
              {files.length > 0 && (
                <div className="selected-files-list">
                  <h4 className="files-list-title">Selected Files ({files.length})</h4>
                  {files.map((file, index) => (
                    <div key={index} className="file-item">
                      <span className="file-icon">{getFileIcon(file.type)}</span>
                      <div className="file-info">
                        <span className="file-name">{file.name}</span>
                        <span className="file-size">{formatFileSize(file.size)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(index)}
                        className="file-remove-btn"
                        aria-label="Remove file"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="form-actions">
              <Button
                type="button"
                variant="secondary"
                onClick={handleCancel}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : '✓ Submit Documentation'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default IncidentDocumentation;