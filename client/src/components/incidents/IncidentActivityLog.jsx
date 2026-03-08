import { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosConfig';
import { formatDateTime } from '../../utils/formatters';
import { FaCircle } from 'react-icons/fa';
import './IncidentActivityLog.css';

const IncidentActivityLog = ({ incidentId, refreshTrigger }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHistory();
    }, [incidentId, refreshTrigger]);

    const fetchHistory = async () => {
        try {
            const response = await axiosInstance.get(`/incidents/${incidentId}/history`);
            // Ensure we set an array, even if response is unexpected
            setHistory(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('Failed to fetch history:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="activity-loader">Loading history...</div>;

    return (
        <div className="activity-log">
            <h3 className="activity-title">Activity Log</h3>
            <div className="activity-timeline">
                {!history || history.length === 0 ? (
                    <p className="no-activity">No activity recorded</p>
                ) : (
                    history.map((log) => (
                        <div key={log._id} className="activity-item">
                            <div className="timeline-marker">
                                <FaCircle className="timeline-dot" />
                                <div className="timeline-line"></div>
                            </div>
                            <div className="activity-content">
                                <p className="activity-header">
                                    <span className="user-name">
                                        {log.performedBy?.name || 'System'}
                                    </span>
                                    <span className="action-text">{log.action.replace('_', ' ')}</span>
                                </p>
                                {log.details && (log.details.from || log.details.to) && (
                                    <p className="activity-detail">
                                        {log.details.from && <span>{log.details.from} &rarr; </span>}
                                        {log.details.to && <span>{log.details.to}</span>}
                                    </p>
                                )}
                                {log.action === 'COMMENT_ADDED' && (
                                    <p className="activity-detail">
                                        Added a comment
                                    </p>
                                )}
                                <span className="activity-time">
                                    {formatDateTime(log.createdAt)}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default IncidentActivityLog;
