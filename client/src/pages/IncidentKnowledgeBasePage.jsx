import React, { useState, useEffect } from 'react';
import './IncidentKnowledgeBasePage.css';

// Mock Auth Context Hook (replace with your actual auth context)
const useAuth = () => {
  // Simulating auth context - replace with actual implementation
  return {
    user: {
      role: 'ADMIN', // Change to 'RESPONDER' or 'REPORTER' to test access control
      name: 'John Smith'
    }
  };
};

// Mock Data
const mockIncidents = [
  {
    id: 'INC-2024-001',
    title: 'Database Connection Pool Exhaustion',
    severity: 'CRITICAL',
    resolvedDate: '2024-01-10',
    rootCause: 'The application\'s database connection pool was configured with a maximum of 20 connections, which was insufficient during peak traffic hours. A memory leak in the connection handling code prevented proper release of connections back to the pool.',
    resolutionSteps: '1. Identified the issue through monitoring alerts showing connection pool saturation\n2. Temporarily increased max connections to 50 to restore service\n3. Deployed emergency patch to fix connection leak in UserService.java\n4. Implemented connection timeout of 30 seconds\n5. Verified connection release through load testing\n6. Monitored system for 48 hours post-deployment',
    preventionMeasures: '• Implement connection pool monitoring with alerts at 70% threshold\n• Add automated tests for connection lifecycle management\n• Establish connection pool sizing guidelines based on traffic patterns\n• Schedule quarterly review of connection pool metrics\n• Add circuit breaker pattern to prevent cascade failures',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    attachments: [
      { name: 'incident-analysis-report.pdf', type: 'PDF', size: '2.4 MB' },
      { name: 'connection-pool-metrics.xlsx', type: 'Excel', size: '856 KB' },
      { name: 'post-incident-review-slides.pptx', type: 'PowerPoint', size: '5.1 MB' }
    ]
  },
  {
    id: 'INC-2024-002',
    title: 'Payment Gateway API Timeout',
    severity: 'HIGH',
    resolvedDate: '2024-01-12',
    rootCause: 'Third-party payment gateway was experiencing degraded performance due to their infrastructure upgrade. Our application lacked proper timeout configuration and retry logic, causing transaction requests to hang indefinitely.',
    resolutionSteps: '1. Confirmed external API degradation through provider status page\n2. Implemented 10-second timeout on payment API calls\n3. Added exponential backoff retry mechanism (max 3 attempts)\n4. Configured circuit breaker to fail fast after 5 consecutive failures\n5. Added fallback notification to users about payment processing delays\n6. Coordinated with payment provider for SLA commitment',
    preventionMeasures: '• Implement health check endpoints for all third-party integrations\n• Set up synthetic monitoring for critical external dependencies\n• Create runbook for common third-party service failures\n• Establish redundant payment gateway provider\n• Add feature flag system to quickly disable problematic integrations',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    attachments: [
      { name: 'api-timeout-logs.txt', type: 'Text', size: '1.2 MB' },
      { name: 'retry-logic-implementation.pdf', type: 'PDF', size: '987 KB' }
    ]
  },
  {
    id: 'INC-2024-003',
    title: 'Memory Leak in Notification Service',
    severity: 'MEDIUM',
    resolvedDate: '2024-01-14',
    rootCause: 'WebSocket connections in the real-time notification service were not being properly closed when users navigated away from the application. Event listeners accumulated over time, causing memory consumption to grow unbounded.',
    resolutionSteps: '1. Analyzed heap dumps to identify growing object count\n2. Identified unclosed WebSocket connections and orphaned event listeners\n3. Implemented cleanup function in React useEffect hook\n4. Added connection lifecycle logging\n5. Deployed fix to production with phased rollout\n6. Verified memory stability through 7-day monitoring period',
    preventionMeasures: '• Add memory profiling to CI/CD pipeline\n• Implement automated leak detection in staging environment\n• Create coding standards for WebSocket connection management\n• Schedule monthly memory usage reviews\n• Add React DevTools Profiler checks during code review',
    videoUrl: '',
    attachments: [
      { name: 'heap-dump-analysis.png', type: 'Image', size: '3.2 MB' },
      { name: 'memory-profile-before-after.pdf', type: 'PDF', size: '1.8 MB' }
    ]
  },
  {
    id: 'INC-2024-004',
    title: 'Authentication Token Expiration Issue',
    severity: 'HIGH',
    resolvedDate: '2024-01-15',
    rootCause: 'JWT refresh token logic was not properly handling edge cases where tokens expired during active user sessions. The token refresh endpoint had a race condition that caused intermittent authentication failures.',
    resolutionSteps: '1. Reproduced issue in development environment\n2. Added mutex lock around token refresh operations\n3. Implemented token refresh queue to prevent concurrent requests\n4. Added 5-minute grace period before token expiration\n5. Deployed fix with backward compatibility\n6. Monitored authentication error rates for reduction',
    preventionMeasures: '• Add integration tests for token lifecycle scenarios\n• Implement token refresh monitoring dashboard\n• Create automated alerts for authentication error spikes\n• Document token handling best practices\n• Add token expiration buffer to client-side logic',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    attachments: [
      { name: 'auth-flow-diagram.png', type: 'Image', size: '654 KB' },
      { name: 'token-race-condition-fix.pdf', type: 'PDF', size: '1.1 MB' }
    ]
  },
  {
    id: 'INC-2024-005',
    title: 'File Upload Service Outage',
    severity: 'MEDIUM',
    resolvedDate: '2024-01-16',
    rootCause: 'Cloud storage bucket reached quota limit due to accumulation of temporary files that were not being cleaned up. The cleanup cron job had been disabled during a previous maintenance window and was never re-enabled.',
    resolutionSteps: '1. Identified storage quota exceeded error in logs\n2. Manually cleared temporary files older than 7 days\n3. Re-enabled and verified cleanup cron job execution\n4. Increased storage quota as temporary measure\n5. Implemented lifecycle policy for automatic file deletion\n6. Added monitoring for storage usage with 80% threshold alert',
    preventionMeasures: '• Create dashboard for storage utilization metrics\n• Implement automated testing for cron job execution\n• Add storage quota alerts at multiple thresholds (70%, 85%, 95%)\n• Document maintenance procedures with verification steps\n• Set up redundant cleanup mechanisms',
    videoUrl: '',
    attachments: [
      { name: 'storage-cleanup-script.sh', type: 'Script', size: '12 KB' },
      { name: 'quota-monitoring-setup.pdf', type: 'PDF', size: '745 KB' }
    ]
  }
];

const IncidentKnowledgeBasePage = () => {
  const { user } = useAuth();
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [incidents] = useState(mockIncidents);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    // Access Control: Only ADMIN and RESPONDER can access
    if (user.role === 'REPORTER') {
      setAccessDenied(true);
    }
  }, [user.role]);

  // Select first incident by default
  useEffect(() => {
    if (incidents.length > 0 && !selectedIncident && !accessDenied) {
      setSelectedIncident(incidents[0]);
    }
  }, [incidents, selectedIncident, accessDenied]);

  const handleIncidentSelect = (incident) => {
    setSelectedIncident(incident);
  };

  const getSeverityClass = (severity) => {
    return `severity-badge severity-${severity.toLowerCase()}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getFileIcon = (type) => {
    const icons = {
      'PDF': '📄',
      'Excel': '📊',
      'PowerPoint': '📊',
      'Image': '🖼️',
      'Text': '📝',
      'Script': '⚙️'
    };
    return icons[type] || '📎';
  };

  // If user is REPORTER, show access denied
  if (accessDenied) {
    return (
      <div className="knowledge-base-page">
        <div className="access-denied">
          <div className="access-denied-icon">🚫</div>
          <h2>Access Denied</h2>
          <p>You do not have permission to view the Knowledge Base.</p>
          <p className="access-denied-detail">
            This page is restricted to Admin and Responder roles only.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="knowledge-base-page">
      <div className="page-header">
        <h1>Post-Incident Knowledge Base</h1>
        <p className="page-subtitle">
          Documentation and learnings from resolved incidents
        </p>
      </div>

      <div className="knowledge-base-container">
        {/* Left Panel: Incident List */}
        <div className="incidents-list-panel">
          <div className="panel-header">
            <h2>Resolved Incidents</h2>
            <span className="incident-count">{incidents.length} incidents</span>
          </div>
          
          <div className="incidents-list">
            {incidents.map((incident) => (
              <div
                key={incident.id}
                className={`incident-item ${selectedIncident?.id === incident.id ? 'selected' : ''}`}
                onClick={() => handleIncidentSelect(incident)}
              >
                <div className="incident-item-header">
                  <span className="incident-id">{incident.id}</span>
                  <span className={getSeverityClass(incident.severity)}>
                    {incident.severity}
                  </span>
                </div>
                <h3 className="incident-title">{incident.title}</h3>
                <div className="incident-date">
                  <span className="date-label">Resolved:</span>
                  <span className="date-value">{formatDate(incident.resolvedDate)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel: Incident Documentation */}
        <div className="documentation-panel">
          {selectedIncident ? (
            <>
              <div className="documentation-header">
                <div className="doc-title-section">
                  <h2>{selectedIncident.title}</h2>
                  <div className="doc-metadata">
                    <span className="doc-id">{selectedIncident.id}</span>
                    <span className={getSeverityClass(selectedIncident.severity)}>
                      {selectedIncident.severity}
                    </span>
                    <span className="doc-date">
                      Resolved on {formatDate(selectedIncident.resolvedDate)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="documentation-content">
                {/* Root Cause */}
                <div className="doc-section">
                  <h3 className="section-title">
                    <span className="section-icon">🔍</span>
                    Root Cause Analysis
                  </h3>
                  <div className="section-content">
                    <p>{selectedIncident.rootCause}</p>
                  </div>
                </div>

                {/* Resolution Steps */}
                <div className="doc-section">
                  <h3 className="section-title">
                    <span className="section-icon">🔧</span>
                    Resolution Steps
                  </h3>
                  <div className="section-content">
                    <pre className="formatted-text">{selectedIncident.resolutionSteps}</pre>
                  </div>
                </div>

                {/* Prevention Measures */}
                <div className="doc-section">
                  <h3 className="section-title">
                    <span className="section-icon">🛡️</span>
                    Prevention Measures
                  </h3>
                  <div className="section-content">
                    <pre className="formatted-text">{selectedIncident.preventionMeasures}</pre>
                  </div>
                </div>

                {/* Video Documentation */}
                {selectedIncident.videoUrl && (
                  <div className="doc-section">
                    <h3 className="section-title">
                      <span className="section-icon">🎥</span>
                      Video Documentation
                    </h3>
                    <div className="section-content">
                      <div className="video-container">
                        <iframe
                          src={selectedIncident.videoUrl}
                          title="Incident Resolution Video"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                      </div>
                    </div>
                  </div>
                )}

                {/* Attachments */}
                <div className="doc-section">
                  <h3 className="section-title">
                    <span className="section-icon">📎</span>
                    Attachments
                  </h3>
                  <div className="section-content">
                    <div className="attachments-list">
                      {selectedIncident.attachments.map((attachment, index) => (
                        <div key={index} className="attachment-item">
                          <span className="attachment-icon">
                            {getFileIcon(attachment.type)}
                          </span>
                          <div className="attachment-info">
                            <span className="attachment-name">{attachment.name}</span>
                            <span className="attachment-meta">
                              {attachment.type} • {attachment.size}
                            </span>
                          </div>
                          <button className="attachment-download">
                            Download
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="no-selection">
              <p>Select an incident to view documentation</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IncidentKnowledgeBasePage;