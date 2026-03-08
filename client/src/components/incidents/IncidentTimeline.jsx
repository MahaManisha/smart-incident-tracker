import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TimelineItem from './TimelineItem';
import LoadingSpinner from '../common/LoadingSpinner';
import './IncidentTimeline.css';

const IncidentTimeline = ({ incidentId, refreshTrigger }) => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTimeline = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('token');
                const response = await axios.get(`/api/incidents/${incidentId}/timeline`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setEvents(response.data);
                setError(null);
            } catch (err) {
                console.error('Failed to fetch timeline:', err);
                setError('Failed to load incident history');
            } finally {
                setLoading(false);
            }
        };

        if (incidentId) {
            fetchTimeline();
        }
    }, [incidentId, refreshTrigger]);

    if (loading) return <LoadingSpinner size="small" />;
    if (error) return <div className="timeline-error">{error}</div>;

    return (
        <div className="incident-timeline">
            {events.length === 0 ? (
                <p className="no-events">No history logs available for this incident.</p>
            ) : (
                <div className="timeline-container">
                    {events.map((event, index) => (
                        <TimelineItem
                            key={event.id || index}
                            event={event}
                            isLast={index === events.length - 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default IncidentTimeline;
