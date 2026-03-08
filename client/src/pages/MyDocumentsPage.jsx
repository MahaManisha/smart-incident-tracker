import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/common/Layout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { toast } from 'react-toastify';
import { FaEye, FaEdit, FaTrash, FaCloudUploadAlt, FaSearch } from 'react-icons/fa';
import { getMyDocuments, uploadDocument, updateDocument, deleteDocument } from '../api/myDocumentsApi';
import { getAllIncidents } from '../api/incidentApi';
import './MyDocumentsPage.css';

const MyDocumentsPage = () => {
    const navigate = useNavigate();
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [incidents, setIncidents] = useState([]);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [filterIncident, setFilterIncident] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterDate, setFilterDate] = useState('');

    // Modal
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [currentDoc, setCurrentDoc] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form
    const [formData, setFormData] = useState({
        document_name: '',
        description: '',
        incident_id: '',
        file: null
    });

    useEffect(() => {
        fetchData();
        fetchIncidents();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchData();
        }, 500); // debounce API calls for search
        return () => clearTimeout(timer);
    }, [searchQuery, filterIncident, filterType, filterDate]);

    const fetchData = async () => {
        try {
            const params = {
                search: searchQuery,
                incident_id: filterIncident,
                file_type: filterType,
                date: filterDate
            };
            const res = await getMyDocuments(params);
            setDocuments(res.data);
        } catch (error) {
            toast.error('Failed to fetch documents');
        } finally {
            setLoading(false);
        }
    };

    const fetchIncidents = async () => {
        try {
            const res = await getAllIncidents();
            setIncidents(res.data.data || res.data); // Adjust based on API structure
        } catch (error) {
            console.error('Failed to load incidents for filter/dropdown', error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const maxSize = 10 * 1024 * 1024;
            const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/png', 'image/jpeg'];

            if (file.size > maxSize) {
                toast.error('File size cannot exceed 10MB');
                e.target.value = '';
                return;
            }
            if (!validTypes.includes(file.type)) {
                toast.error('Only PDF, DOC, DOCX, PNG, JPG are allowed');
                e.target.value = '';
                return;
            }
            setFormData(prev => ({ ...prev, file }));
        }
    };

    const openCreateModal = () => {
        setCurrentDoc(null);
        setFormData({ document_name: '', description: '', incident_id: '', file: null });
        setIsUploadModalOpen(true);
    };

    const openEditModal = (doc) => {
        setCurrentDoc(doc);
        setFormData({
            document_name: doc.document_name,
            description: doc.description,
            incident_id: doc.incident_id?._id || '',
            file: null
        });
        setIsUploadModalOpen(true);
    };

    const handleUploadSubmit = async (e) => {
        e.preventDefault();
        try {
            setIsSubmitting(true);
            const data = new FormData();
            data.append('document_name', formData.document_name);
            data.append('description', formData.description);
            if (formData.incident_id) data.append('incident_id', formData.incident_id);
            if (formData.file) data.append('file', formData.file);

            if (currentDoc) {
                await updateDocument(currentDoc._id, data);
                toast.success('Document updated successfully');
            } else {
                if (!formData.file) {
                    toast.error('File is required for upload');
                    setIsSubmitting(false);
                    return;
                }
                await uploadDocument(data);
                toast.success('Document uploaded successfully');
            }
            setIsUploadModalOpen(false);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to submit document');
        } finally {
            setIsSubmitting(false);
        }
    };

    const confirmDelete = (doc) => {
        setCurrentDoc(doc);
        setIsDeleteModalOpen(true);
    };

    const handleDelete = async () => {
        try {
            setIsSubmitting(true);
            await deleteDocument(currentDoc._id);
            toast.success('Document deleted successfully');
            setIsDeleteModalOpen(false);
            fetchData();
        } catch (error) {
            toast.error('Failed to delete document');
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getFileExt = (type) => {
        if (type.includes('pdf')) return 'PDF';
        if (type.includes('word') || type.includes('doc')) return 'DOCX';
        if (type.includes('png')) return 'PNG';
        if (type.includes('jpeg') || type.includes('jpg')) return 'JPG';
        return type.split('/')[1]?.toUpperCase() || 'FILE';
    };

    return (
        <Layout>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 className="page-title">My Documents</h1>
                <button className="btn btn-primary" onClick={openCreateModal}>
                    <FaCloudUploadAlt style={{ marginRight: '8px' }} /> Upload New
                </button>
            </div>

            <div className="my-documents-card">
                {/* Filters */}
                <div className="filters-bar">
                    <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
                        <FaSearch style={{ position: 'absolute', left: '12px', top: '12px', color: '#9ca3af' }} />
                        <input
                            type="text"
                            placeholder="Search by name or ID..."
                            className="search-input"
                            style={{ paddingLeft: '32px' }}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <select className="filter-select" value={filterIncident} onChange={(e) => setFilterIncident(e.target.value)}>
                        <option value="">All Incidents</option>
                        {Array.isArray(incidents) && incidents.map(inc => (
                            <option key={inc._id} value={inc._id}>{inc.title || inc.incidentNumber}</option>
                        ))}
                    </select>
                    <select className="filter-select" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                        <option value="">All File Types</option>
                        <option value="pdf">PDF</option>
                        <option value="word">Word Docs</option>
                        <option value="image">Images</option>
                    </select>
                    <input
                        type="date"
                        className="filter-select"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                    />
                </div>

                {loading ? (
                    <LoadingSpinner />
                ) : documents.length === 0 ? (
                    <div className="empty-state">
                        <FaCloudUploadAlt style={{ fontSize: '3rem', marginBottom: '1rem', color: '#9ca3af' }} />
                        <h3>No documents uploaded yet</h3>
                        <p>Upload files to attach them to your incident reports.</p>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="documents-table">
                            <thead>
                                <tr>
                                    <th>Document Name</th>
                                    <th>Incident</th>
                                    <th>Type</th>
                                    <th>Size</th>
                                    <th>Uploaded</th>
                                    <th>Updated</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {documents.map(doc => (
                                    <tr key={doc._id}>
                                        <td className="doc-name">{doc.document_name}</td>
                                        <td>
                                            {doc.incident_id ? (
                                                <span
                                                    className="incident-link"
                                                    onClick={() => navigate(`/incidents/${doc.incident_id._id}`)}
                                                >
                                                    {doc.incident_id.incidentNumber || 'View Incident'}
                                                </span>
                                            ) : (
                                                <span style={{ color: '#9ca3af' }}>Unlinked</span>
                                            )}
                                        </td>
                                        <td>{getFileExt(doc.file_type)}</td>
                                        <td>{formatSize(doc.file_size)}</td>
                                        <td>{new Date(doc.created_at).toLocaleDateString()}</td>
                                        <td>{new Date(doc.updated_at).toLocaleDateString()}</td>
                                        <td>
                                            {doc.deleted_at ? (
                                                <span className="status-deleted">Deleted</span>
                                            ) : (
                                                <span className="status-active">Active</span>
                                            )}
                                        </td>
                                        <td className="doc-actions">
                                            <a href={`http://localhost:5000${doc.file_path}`} target="_blank" rel="noopener noreferrer" className="action-btn" title="View Document">
                                                <FaEye />
                                            </a>
                                            {!doc.deleted_at && !doc.is_knowledge_base && (
                                                <>
                                                    <button className="action-btn" title="Edit Metadata/Replace File" onClick={() => openEditModal(doc)}>
                                                        <FaEdit />
                                                    </button>
                                                    <button className="action-btn delete" title="Delete Document" onClick={() => confirmDelete(doc)}>
                                                        <FaTrash />
                                                    </button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Upload/Edit Modal */}
            {isUploadModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>{currentDoc ? 'Edit Document' : 'Upload New Document'}</h2>
                        <form onSubmit={handleUploadSubmit}>
                            <div className="form-group">
                                <label className="form-label">Document Name *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    name="document_name"
                                    value={formData.document_name}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <textarea
                                    className="form-textarea"
                                    name="description"
                                    rows="3"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Link to Incident (Optional)</label>
                                <select
                                    className="form-input"
                                    name="incident_id"
                                    value={formData.incident_id}
                                    onChange={handleInputChange}
                                >
                                    <option value="">None</option>
                                    {Array.isArray(incidents) && incidents.map(inc => (
                                        <option key={inc._id} value={inc._id}>{inc.title || inc.incidentNumber}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">{currentDoc ? 'Replace File (Optional)' : 'Select File *'}</label>
                                <input
                                    type="file"
                                    className="form-input"
                                    onChange={handleFileChange}
                                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                                />
                                <small style={{ color: '#9ca3af', marginTop: '4px', display: 'block' }}>Max 10MB. Allowed: PDF, DOC, DOCX, PNG, JPG</small>
                            </div>
                            <div className="form-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setIsUploadModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                                    {isSubmitting ? 'Saving...' : 'Save Document'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {isDeleteModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '400px' }}>
                        <h2>Confirm Delete</h2>
                        <p>Are you sure you want to delete this document? It will be soft-deleted.</p>
                        <div className="form-actions">
                            <button className="btn btn-secondary" onClick={() => setIsDeleteModalOpen(false)}>Cancel</button>
                            <button className="btn btn-danger" onClick={handleDelete} disabled={isSubmitting}>
                                {isSubmitting ? 'Deleting...' : 'Yes, Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default MyDocumentsPage;
