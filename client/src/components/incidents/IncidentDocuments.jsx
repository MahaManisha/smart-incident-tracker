import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FaFileAlt, FaFileUpload, FaPaperclip, FaTimes, FaDownload, FaPen, FaFilePdf, FaFileWord, FaFileImage, FaFileVideo, FaFile } from 'react-icons/fa';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { createDocumentation, getDocumentationByIncidentId, updateDocumentation } from '../../api/documentationApi';
import { useAuth } from '../../contexts/AuthContext';
import { formatDateTime } from '../../utils/formatters';
import './IncidentDocuments.css';

const IncidentDocuments = ({ incidentId, isResolved, canEdit }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [documentation, setDocumentation] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        rootCause: '',
        resolutionSteps: '',
        preventiveSteps: ''
    });
    const [files, setFiles] = useState([]);
    const [removedFiles, setRemovedFiles] = useState([]);

    useEffect(() => {
        loadDocumentation();
    }, [incidentId]);

    const loadDocumentation = async () => {
        try {
            setLoading(true);
            const res = await getDocumentationByIncidentId(incidentId);
            if (res && res.data) {
                setDocumentation(res.data);
                // Pre-fill form if we edit later
                setFormData({
                    title: res.data.title || '',
                    rootCause: res.data.rootCause || '',
                    resolutionSteps: res.data.resolutionSteps || res.data.description || '',
                    preventiveSteps: res.data.preventiveSteps || ''
                });
            } else {
                setDocumentation(null);
            }
        } catch (error) {
            // 404 is expected if no docs yet
            setDocumentation(null);
        } finally {
            setLoading(false);
        }
    };

    const handleStartEdit = () => {
        setIsEditing(true);
        setFiles([]);
        setRemovedFiles([]);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setFiles([]);
        setRemovedFiles([]);
        // Reset form to current doc state
        if (documentation) {
            setFormData({
                title: documentation.title || '',
                rootCause: documentation.rootCause || '',
                resolutionSteps: documentation.resolutionSteps || documentation.description || '',
                preventiveSteps: documentation.preventiveSteps || ''
            });
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        const allowedTypes = [
            'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/jpeg', 'image/png', 'video/mp4', 'video/webm'
        ];
        const maxSize = 20 * 1024 * 1024; // 20MB

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

        setFiles(prev => [...prev, ...validFiles]);
    };

    const removeNewFile = (index) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const removeExistingFile = (file) => {
        if (window.confirm(`Remove ${file.name}?`)) {
            setRemovedFiles(prev => [...prev, file.name]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const data = new FormData();
            data.append('incidentId', incidentId);
            data.append('title', formData.title);
            data.append('rootCause', formData.rootCause);
            data.append('resolutionSteps', formData.resolutionSteps);
            data.append('description', formData.resolutionSteps); // Backwards compat
            data.append('preventiveSteps', formData.preventiveSteps);

            if (documentation) {
                data.append('removedFiles', JSON.stringify(removedFiles));
            }

            files.forEach(file => data.append('files', file));

            if (documentation) {
                await updateDocumentation(incidentId, data);
                toast.success('Documentation updated');
            } else {
                await createDocumentation(data);
                toast.success('Documentation created');
            }

            setIsEditing(false);
            loadDocumentation();
        } catch (error) {
            console.error(error);
            toast.error(error.message || 'Failed to save documentation');
        } finally {
            setSubmitting(false);
        }
    };

    const getFileIcon = (mimeType) => {
        if (mimeType.includes('pdf')) return <FaFilePdf className="file-icon pdf" />;
        if (mimeType.includes('word')) return <FaFileWord className="file-icon word" />;
        if (mimeType.includes('image')) return <FaFileImage className="file-icon image" />;
        if (mimeType.includes('video')) return <FaFileVideo className="file-icon video" />;
        return <FaFile className="file-icon" />;
    };

    if (loading) return <LoadingSpinner size="sm" />;

    // View Mode
    if (!isEditing && documentation) {
        return (
            <div className="incident-documents-view">
                <div className="doc-header">
                    <h3><FaFileAlt /> Post-Incident Report</h3>
                    {canEdit && (
                        <Button variant="outline" size="sm" onClick={handleStartEdit}>
                            <FaPen /> Edit Report
                        </Button>
                    )}
                </div>

                <div className="doc-meta">
                    <span className="meta-item">Submitted by <strong>{documentation.submittedBy?.name || 'Unknown'}</strong></span>
                    <span className="meta-item">on {formatDateTime(documentation.createdAt)}</span>
                </div>

                <div className="doc-section">
                    <h4>Root Cause</h4>
                    <p>{documentation.rootCause}</p>
                </div>

                <div className="doc-section">
                    <h4>Resolution Steps</h4>
                    <p>{documentation.resolutionSteps || documentation.description}</p>
                </div>

                {documentation.preventiveSteps && (
                    <div className="doc-section">
                        <h4>Preventive Measures</h4>
                        <p>{documentation.preventiveSteps}</p>
                    </div>
                )}

                {documentation.attachments && documentation.attachments.length > 0 && (
                    <div className="doc-attachments">
                        <h4>Evidence & Logs</h4>
                        <div className="attachment-grid">
                            {documentation.attachments.map((file, idx) => (
                                <div key={idx} className="attachment-card">
                                    {getFileIcon(file.type)}
                                    <div className="attachment-info">
                                        <div className="attachment-name" title={file.name}>{file.name}</div>
                                        <div className="attachment-size">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                                    </div>
                                    <a href={`http://localhost:5000/${file.path}`} target="_blank" rel="noopener noreferrer" className="download-btn">
                                        <FaDownload />
                                    </a>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Empty State (No Docs)
    if (!isEditing && !documentation) {
        return (
            <div className="incident-documents-empty">
                <div className="empty-content">
                    <FaFileAlt className="empty-icon" />
                    <p>No documentation filed yet.</p>
                    {canEdit && isResolved ? (
                        <Button variant="primary" onClick={handleStartEdit}>
                            Create Post-Mortem Report
                        </Button>
                    ) : (
                        <p className="text-secondary text-sm">Documentation can be added once resolved.</p>
                    )}
                </div>
            </div>
        );
    }

    // Edit/Create Mode
    return (
        <div className="incident-documents-form">
            <div className="form-header">
                <h3>{documentation ? 'Edit Documentation' : 'New Incident Report'}</h3>
            </div>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label className="required">Summary Title</label>
                    <input
                        name="title"
                        className="form-input"
                        value={formData.title}
                        onChange={handleInputChange}
                        required
                        placeholder="e.g. Database outage due to connection pool exhaustion"
                    />
                </div>

                <div className="form-group">
                    <label className="required">Root Cause Analysis</label>
                    <textarea
                        name="rootCause"
                        className="form-textarea"
                        rows="3"
                        value={formData.rootCause}
                        onChange={handleInputChange}
                        required
                        placeholder="Why did this happen?"
                    />
                </div>

                <div className="form-group">
                    <label className="required">Resolution Steps</label>
                    <textarea
                        name="resolutionSteps"
                        className="form-textarea"
                        rows="4"
                        value={formData.resolutionSteps}
                        onChange={handleInputChange}
                        required
                        placeholder="How was it fixed?"
                    />
                </div>

                <div className="form-group">
                    <label>Preventive Measures</label>
                    <textarea
                        name="preventiveSteps"
                        className="form-textarea"
                        rows="3"
                        value={formData.preventiveSteps}
                        onChange={handleInputChange}
                        placeholder="How to prevent recurrence?"
                    />
                </div>

                <div className="form-group">
                    <label>Attachments</label>
                    {documentation && documentation.attachments && documentation.attachments.length > 0 && (
                        <div className="existing-files-list">
                            {documentation.attachments
                                .filter(f => !removedFiles.includes(f.name))
                                .map((file, idx) => (
                                    <div key={idx} className="file-chip">
                                        <FaPaperclip /> {file.name}
                                        <button type="button" onClick={() => removeExistingFile(file)}><FaTimes /></button>
                                    </div>
                                ))}
                        </div>
                    )}

                    <div className="upload-box">
                        <label htmlFor="doc-upload" className="upload-label">
                            <FaFileUpload /> Upload Files
                        </label>
                        <input id="doc-upload" type="file" multiple onChange={handleFileChange} className="hidden-input" />
                        <span className="upload-hint">{files.length} new files selected</span>
                    </div>

                    {files.length > 0 && (
                        <div className="new-files-list">
                            {files.map((f, i) => (
                                <div key={i} className="file-chip new">
                                    {f.name} <button type="button" onClick={() => removeNewFile(i)}><FaTimes /></button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="form-actions">
                    <Button type="button" variant="secondary" onClick={handleCancelEdit} disabled={submitting}>Cancel</Button>
                    <Button type="submit" variant="primary" disabled={submitting}>
                        {submitting ? 'Saving...' : 'Save Report'}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default IncidentDocuments;
