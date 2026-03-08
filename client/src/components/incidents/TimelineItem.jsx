import React from 'react';
import {
    FaPlus,
    FaUser,
    FaSync,
    FaExclamationTriangle,
    FaCheck,
    FaCommentAlt,
    FaLevelUpAlt,
    FaLock,
    FaShieldAlt
} from 'react-icons/fa';
import { formatDateTime } from '../../utils/formatters';

const TimelineItem = ({ event, isLast }) => {
    const getIcon = (type) => {
        switch (type) {
            case 'CREATED': return <FaPlus />;
            case 'ASSIGNED': return <FaUser />;
            case 'STATUS_CHANGED': return <FaSync />;
            case 'PRIORITY_CHANGED': return <FaExclamationTriangle />;
            case 'ESCALATED': return <FaLevelUpAlt />;
            case 'RESOLVED': return <FaCheck />;
            case 'COMMENT': return <FaCommentAlt />;
            case 'CLOSED': return <FaLock />;
            case 'SLA_BREACH': return <FaShieldAlt />;
            default: return <FaSync />;
        }
    };

    const getBadgeClass = (type) => {
        switch (type) {
            case 'CREATED': return 'bg-success-subtle text-success';
            case 'ESCALATED': return 'bg-danger-subtle text-danger';
            case 'RESOLVED': return 'bg-primary-subtle text-primary';
            case 'PRIORITY_CHANGED': return 'bg-warning-subtle text-warning';
            default: return 'bg-secondary-subtle text-secondary';
        }
    };

    return (
        <div className={`timeline-item ${isLast ? 'last' : ''}`}>
            <div className="timeline-marker">
                <div className={`marker-icon ${event.type.toLowerCase()}`}>
                    {getIcon(event.type)}
                </div>
                {!isLast && <div className="marker-line"></div>}
            </div>

            <div className="timeline-content">
                <div className="timeline-header">
                    <span className="event-message">{event.message}</span>
                    <span className="event-time">{formatDateTime(event.timestamp)}</span>
                </div>

                <div className="timeline-footer">
                    <span className="event-user">
                        <FaUser style={{ marginRight: '4px', fontSize: '10px' }} />
                        {event.user} <span className="user-role-badge">({event.userRole})</span>
                    </span>
                </div>
            </div>
        </div>
    );
};

export default TimelineItem;
