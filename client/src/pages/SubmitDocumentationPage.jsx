import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/common/Layout';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatusBadge from '../components/common/StatusBadge';
import { createDocumentation, getDocumentationByIncidentId, updateDocumentation } from '../api/documentationApi';
import { getIncidentById } from '../api/incidentApi';
import { toast } from 'react-toastify';
import { FaFileAlt, FaFileUpload, FaPaperclip, FaTimes, FaInfoCircle, FaPen } from 'react-icons/fa';
import './SubmitDocumentationPage.css';

const SubmitDocumentationPage = ({ isEditMode = false }) => {
    const navigate = useNavigate();
    const { id: incidentId } = useParams();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [incident, setIncident] = useState(null);
    const [initialDoc, setInitialDoc] = useState(null);

    const [formData, setFormData] = useState({
        summary: '',
        rootCause: '',
        resolutionSteps: '',
        preventiveSteps: '',
    });

    const [files, setFiles] = useState([]);
    const [existingFiles, setExistingFiles] = useState([]);
    const [removedFiles, setRemovedFiles] = useState([]);

    // Load incident details and documentation if editing
    useEffect(() => {
        const loadData = async () => {
            if (!incidentId) return;
            try {
                setLoading(true);
                const incidentData = await getIncidentById(incidentId);
                setIncident(incidentData);

                if (isEditMode) {
                    const docData = await getDocumentationByIncidentId(incidentId);
                    if (docData && docData.data) {
                        const doc = docData.data;
                        setInitialDoc(doc);
                        setFormData({
                            summary: doc.title || '',
                            rootCause: doc.rootCause || '',
                            resolutionSteps: doc.resolutionSteps || doc.description || '',
                            preventiveSteps: doc.preventiveSteps || '',
                        });
                        setExistingFiles(doc.attachments || []);
                    }
                } else {
                    // Create mode default
                    if (incidentData) {
                        setFormData(prev => ({
                            ...prev,
                            summary: `Resolution: ${incidentData.title}`
                        }));
                    }
                }
            } catch (error) {
                console.error('Failed to load data', error);
                if (isEditMode && error.response?.status === 404) {
                    toast.error('No documentation found to edit');
                    navigate(`/incidents/${incidentId}`);
                } else {
                    toast.error('Failed to load incident details');
                }
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [incidentId, isEditMode, navigate]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        const allowedTypes = [
            'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/jpeg', 'image/png', 'video/mp4', 'video/webm'
        ];
        const maxSize = 20 * 1024 * 1024; // 20MB limit

        const validFiles = selectedFiles.filter(file => {
            if (!allowedTypes.includes(file.type)) {
                toast.error(`Invalid file type: ${file.name}`);
                return false;
            }
            if (file.size > maxSize) {
                toast.error(`File too large: ${file.name}`);
                return false;
            }
            return true;
        });

        setFiles((prev) => [...prev, ...validFiles]);
    };

    const removeFile = (index) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const removeExistingFile = (file) => {
        if (window.confirm(`Are you sure you want to remove ${file.name}?`)) {
            setExistingFiles(prev => prev.filter(f => f.name !== file.name));
            setRemovedFiles(prev => [...prev, file.name]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            const data = new FormData();

            data.append('title', formData.summary);
            data.append('rootCause', formData.rootCause);
            data.append('resolutionSteps', formData.resolutionSteps);
            data.append('description', formData.resolutionSteps);
            data.append('preventiveSteps', formData.preventiveSteps);
            data.append('incidentId', incidentId);

            if (isEditMode) {
                data.append('removedFiles', JSON.stringify(removedFiles));
            }

            files.forEach((file) => {
                data.append('files', file);
            });

            if (isEditMode) {
                await updateDocumentation(incidentId, data);
                toast.success('Documentation updated successfully');
            } else {
                await createDocumentation(data);
                toast.success('Documentation submitted successfully');
            }

            navigate(`/incidents/${incidentId}`);
        } catch (error) {
            toast.error(error.message || 'Failed to submit documentation');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <Layout><LoadingSpinner /></Layout>;

    return (
        <Layout>
            <div className="submit-doc-page">
                <div className="page-header">
                    <h1 className="page-title">
                        <span className="header-icon">{isEditMode ? <FaPen /> : <FaFileAlt />}</span>
                        {isEditMode ? 'Edit Documentation' : 'Create Incident Documentation'}
                    </h1>
                    <p className="page-description">
                        {isEditMode
                            ? 'Update the root cause, resolution steps, and attachments.'
                            : 'Record the root cause, resolution steps, and preventive measures for this incident.'}
                    </p>
                </div>

                {/* A. Incident Context Section */}
                {incident && (
                    <div className="incident-context-card">
                        <div className="context-header">
                            <FaInfoCircle className="context-icon" />
                            <h3>Incident Context</h3>
                        </div>
                        <div className="context-grid">
                            <div className="context-item">
                                <label>Incident ID</label>
                                <span className="mono-badge">{incident.incidentNumber}</span>
                            </div>
                            <div className="context-item">
                                <label>Title</label>
                                <strong>{incident.title}</strong>
                            </div>
                            <div className="context-item">
                                <label>Current Status</label>
                                <StatusBadge status={incident.status} type="status" />
                            </div>
                            <div className="context-item">
                                <label>Severity</label>
                                <StatusBadge status={incident.severity} type="severity" />
                            </div>
                        </div>
                    </div>
                )}

                <div className="form-container">
                    <form onSubmit={handleSubmit}>
                        {/* B. Documentation Form */}
                        <div className="form-group">
                            <label htmlFor="summary" className="form-label required">Summary</label>
                            <input
                                type="text"
                                id="summary"
                                name="summary"
                                className="form-input"
                                placeholder="Brief summary of the documentation..."
                                value={formData.summary}
                                onChange={handleInputChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="rootCause" className="form-label required">Root Cause Analysis</label>
                            <textarea
                                id="rootCause"
                                name="rootCause"
                                className="form-textarea"
                                rows="4"
                                placeholder="What was the underlying cause of this incident?"
                                value={formData.rootCause}
                                onChange={handleInputChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="resolutionSteps" className="form-label required">Resolution Steps</label>
                            <textarea
                                id="resolutionSteps"
                                name="resolutionSteps"
                                className="form-textarea"
                                rows="6"
                                placeholder="Detailed steps taken to resolve the issue..."
                                value={formData.resolutionSteps}
                                onChange={handleInputChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="preventiveSteps" className="form-label">Prevention / Future Fixes</label>
                            <textarea
                                id="preventiveSteps"
                                name="preventiveSteps"
                                className="form-textarea"
                                rows="4"
                                placeholder="Measures to prevent recurrence..."
                                value={formData.preventiveSteps}
                                onChange={handleInputChange}
                            />
                        </div>

                        {/* C. Attachments */}
                        <div className="form-group">
                            <label className="form-label">Attachments</label>

                            {/* Existing Files (Edit Mode) */}
                            {isEditMode && existingFiles.length > 0 && (
                                <div className="file-list existing-files">
                                    <h4 className="file-list-header">Existing Attachments</h4>
                                    {existingFiles.map((file, index) => (
                                        <div key={`existing-${index}`} className="file-item existing">
                                            <FaPaperclip className="file-icon" />
                                            <div className="file-info">
                                                <span className="file-name">{file.name}</span>
                                                <span className="file-size">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                                            </div>
                                            <button
                                                type="button"
                                                className="remove-file-btn"
                                                onClick={() => removeExistingFile(file)}
                                                title="Remove existing file"
                                            >
                                                <FaTimes />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="file-upload-area">
                                <input
                                    type="file"
                                    id="files"
                                    multiple
                                    className="file-input-hidden"
                                    onChange={handleFileChange}
                                />
                                <label htmlFor="files" className="file-upload-label-box">
                                    <FaFileUpload className="upload-icon-large" />
                                    <span>{isEditMode ? 'Upload new files' : 'Click to upload evidence or logs'}</span>
                                    <span className="upload-hint">Supported: PDF, DOCX, PNG, JPG, MP4 (Max 20MB)</span>
                                </label>
                            </div>

                            {/* New Files */}
                            {files.length > 0 && (
                                <div className="file-list">
                                    <h4 className="file-list-header">New Uploads</h4>
                                    {files.map((file, index) => (
                                        <div key={`new-${index}`} className="file-item">
                                            <FaPaperclip className="file-icon" />
                                            <div className="file-info">
                                                <span className="file-name">{file.name}</span>
                                                <span className="file-size">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                                            </div>
                                            <button
                                                type="button"
                                                className="remove-file-btn"
                                                onClick={() => removeFile(index)}
                                            >
                                                <FaTimes />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="form-actions">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => navigate(`/incidents/${incidentId}`)}
                                disabled={submitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                disabled={submitting}
                            >
                                {submitting ? 'Saving...' : (isEditMode ? 'Update Documentation' : 'Submit Documentation')}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    );
};

export default SubmitDocumentationPage;
