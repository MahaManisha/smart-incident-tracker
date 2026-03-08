import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getAllIncidents } from '../api/incidentApi';
import { getAllDocumentation } from '../api/documentationApi';
import { USER_ROLES } from '../utils/constants';
import Layout from '../components/common/Layout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
  FaSearch,
  FaTools,
  FaShieldAlt,
  FaVideo,
  FaPaperclip,
  FaFilePdf,
  FaFileExcel,
  FaFilePowerpoint,
  FaFileImage,
  FaFileAlt,
  FaFileCode,
  FaBan,
  FaClipboardCheck,
  FaCalendarCheck,
  FaBook
} from 'react-icons/fa';
import './IncidentKnowledgeBasePage.css';

const IncidentKnowledgeBasePage = () => {
  const { user, hasRole } = useAuth();
  const [selectedItem, setSelectedItem] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    // Access Control: Only ADMIN and RESPONDER can access
    if (!hasRole(USER_ROLES.ADMIN) && !hasRole(USER_ROLES.RESPONDER)) {
      setAccessDenied(true);
      return;
    }

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [incidentsRes, docsRes] = await Promise.all([
        getAllIncidents({ status: 'RESOLVED' }),
        getAllDocumentation()
      ]);

      const incidentItems = (incidentsRes.incidents || []).map(inc => ({
        ...inc,
        type: 'INCIDENT',
        displayDate: inc.resolvedAt || inc.updatedAt,
        displayName: inc.title
      }));

      const docItems = (docsRes.data || []).map(doc => ({
        ...doc,
        type: 'DOCUMENTATION',
        displayDate: doc.createdAt,
        displayName: doc.title
      }));

      // Merge and sort by newest first
      const combinedItems = [...incidentItems, ...docItems].sort((a, b) =>
        new Date(b.displayDate) - new Date(a.displayDate)
      );

      setItems(combinedItems);
    } catch (error) {
      console.error('Failed to load knowledge base data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleItemSelect = (item) => {
    setSelectedItem(item);
  };

  const getSeverityClass = (severity) => {
    return `severity-badge severity-${severity?.toLowerCase() || 'low'}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getFileIcon = (type) => {
    // Check if type is MIME type or simple string
    if (type?.includes('pdf')) return <FaFilePdf className="file-icon pdf" />;
    if (type?.includes('sheet') || type?.includes('excel')) return <FaFileExcel className="file-icon excel" />;
    if (type?.includes('presentation') || type?.includes('powerpoint')) return <FaFilePowerpoint className="file-icon ppt" />;
    if (type?.includes('image')) return <FaFileImage className="file-icon image" />;
    return <FaFileAlt className="file-icon text" />;
  };

  // If user is REPORTER, show access denied
  if (accessDenied) {
    return (
      <Layout>
        <div className="knowledge-base-page">
          <div className="access-denied">
            <div className="access-denied-icon"><FaBan /></div>
            <h2>Access Denied</h2>
            <p>You do not have permission to view the Knowledge Base.</p>
            <p className="access-denied-detail">
              This page is restricted to Admin and Responder roles only.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="knowledge-base-page">
        <div className="page-header">
          <h1>
            <span className="header-icon"><FaClipboardCheck /></span>
            Knowledge Base
          </h1>
          <p className="page-subtitle">
            Post-incident analysis and technical documentation
          </p>
        </div>

        <div className="knowledge-base-container">
          {/* Left Panel: List */}
          <div className="incidents-list-panel">
            <div className="panel-header">
              <h2>Knowledge Entries</h2>
              <span className="incident-count">{items.length} items</span>
            </div>

            {loading ? (
              <div className="panel-loading">
                <LoadingSpinner size="sm" />
              </div>
            ) : (
              <div className="incidents-list">
                {items.length === 0 ? (
                  <div className="no-selection">
                    <div className="empty-state-content">
                      <p className="empty-title">No entries found</p>
                      <p className="empty-desc">
                        Resolved incidents and documentation will appear here.
                      </p>
                    </div>
                  </div>
                ) : (
                  items.map((item) => (
                    <div
                      key={item._id}
                      className={`incident-item ${selectedItem?._id === item._id ? 'selected' : ''}`}
                      onClick={() => handleItemSelect(item)}
                    >
                      <div className="incident-item-header">
                        {item.type === 'INCIDENT' ? (
                          <>
                            <span className="incident-id">#{item.incidentNumber}</span>
                            <span className={getSeverityClass(item.severity)}>
                              {item.severity}
                            </span>
                          </>
                        ) : (
                          <span className="doc-badge"><FaBook /> DOC</span>
                        )}
                      </div>
                      <h3 className="incident-title">{item.displayName}</h3>
                      <div className="incident-date">
                        <span className="date-label">
                          {item.type === 'INCIDENT' ? <FaCalendarCheck /> : <FaFileAlt />}
                          {item.type === 'INCIDENT' ? ' Resolved:' : ' Created:'}
                        </span>
                        <span className="date-value">{formatDate(item.displayDate)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Right Panel: Content */}
          <div className="documentation-panel">
            {selectedItem ? (
              <>
                <div className="documentation-header">
                  <div className="doc-title-section">
                    <h2>{selectedItem.displayName}</h2>
                    <div className="doc-metadata">
                      {selectedItem.type === 'INCIDENT' ? (
                        <>
                          <span className="doc-id">#{selectedItem.incidentNumber}</span>
                          <span className={getSeverityClass(selectedItem.severity)}>
                            {selectedItem.severity}
                          </span>
                          <span className="doc-date">
                            Resolved on {formatDate(selectedItem.resolvedAt)}
                          </span>
                        </>
                      ) : (
                        <div className="doc-author-meta">
                          <span className="doc-badge large"><FaBook /> Documentation</span>
                          <span className="doc-author">By {selectedItem.submittedBy?.name || 'Unknown'}</span>
                          <span className="doc-date">on {formatDate(selectedItem.createdAt)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="documentation-content">

                  {/* === INCIDENT VIEW === */}
                  {selectedItem.type === 'INCIDENT' && (
                    <>
                      <div className="doc-section">
                        <h3 className="section-title">
                          <span className="section-icon"><FaSearch /></span>
                          Root Cause Analysis
                        </h3>
                        <div className="section-content">
                          <p>{selectedItem.rootCause || "No root cause analysis recorded."}</p>
                        </div>
                      </div>

                      <div className="doc-section">
                        <h3 className="section-title">
                          <span className="section-icon"><FaTools /></span>
                          Resolution Steps
                        </h3>
                        <div className="section-content">
                          <pre className="formatted-text">{selectedItem.resolutionSteps || "No resolution steps recorded."}</pre>
                        </div>
                      </div>

                      <div className="doc-section">
                        <h3 className="section-title">
                          <span className="section-icon"><FaShieldAlt /></span>
                          Prevention Measures
                        </h3>
                        <div className="section-content">
                          <pre className="formatted-text">{selectedItem.preventionMeasures || "No prevention measures recorded."}</pre>
                        </div>
                      </div>
                    </>
                  )}

                  {/* === GENERAL DOC VIEW === */}
                  {selectedItem.type === 'DOCUMENTATION' && (
                    <>
                      {selectedItem.incidentId && (
                        <div className="doc-section">
                          <h3 className="section-title">
                            <span className="section-icon"><FaClipboardCheck /></span>
                            Related Incident
                          </h3>
                          <div className="section-content">
                            <div className="related-incident-link">
                              <strong>#{selectedItem.incidentId.incidentNumber}:</strong> {selectedItem.incidentId.title}
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="doc-section">
                        <h3 className="section-title">
                          <span className="section-icon"><FaSearch /></span>
                          Description / Overview
                        </h3>
                        <div className="section-content">
                          <pre className="formatted-text">{selectedItem.description}</pre>
                        </div>
                      </div>

                      {selectedItem.preventiveSteps && (
                        <div className="doc-section">
                          <h3 className="section-title">
                            <span className="section-icon"><FaShieldAlt /></span>
                            Preventive Steps & Learnings
                          </h3>
                          <div className="section-content">
                            <pre className="formatted-text">{selectedItem.preventiveSteps}</pre>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* === ATTACHMENTS (SHARED) === */}
                  {(selectedItem.videoUrl || (selectedItem.attachments && selectedItem.attachments.length > 0)) && (
                    <div className="doc-section">
                      <h3 className="section-title">
                        <span className="section-icon"><FaPaperclip /></span>
                        Attachments & Media
                      </h3>
                      <div className="section-content">
                        {/* Legacy Video URL */}
                        {selectedItem.videoUrl && (
                          <div className="video-container">
                            <iframe
                              src={selectedItem.videoUrl}
                              title="Incident Resolution Video"
                              frameBorder="0"
                              allowFullScreen
                            ></iframe>
                          </div>
                        )}

                        {/* File Attachments */}
                        {selectedItem.attachments && selectedItem.attachments.length > 0 && (
                          <div className="attachments-list">
                            {selectedItem.attachments.map((attachment, index) => (
                              <div key={index} className="attachment-item">
                                <span className="attachment-icon">
                                  {getFileIcon(attachment.type)}
                                </span>
                                <div className="attachment-info">
                                  <span className="attachment-name">{attachment.name}</span>
                                  <span className="attachment-meta">
                                    {attachment.type} • {(attachment.size / 1024).toFixed(0)} KB
                                  </span>
                                </div>
                                <a
                                  href={`http://localhost:5000/${attachment.path}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="attachment-download"
                                >
                                  View
                                </a>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                </div>
              </>
            ) : (
              <div className="no-selection">
                <div style={{ textAlign: 'center' }}>
                  <p className="select-prompt-icon"><FaClipboardCheck /></p>
                  <p style={{ fontSize: '1.25rem', fontWeight: '500', color: '#4a5568', marginBottom: '0.5rem' }}>
                    Select an entry
                  </p>
                  <p style={{ fontSize: '0.95rem', color: '#718096' }}>
                    Resolved incidents and documentation details will be shown here
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default IncidentKnowledgeBasePage;