import React from 'react';
import './PriorityBadge.css';

const PriorityBadge = ({ priority }) => {
    const normalizedPriority = priority ? priority.toUpperCase() : 'P3';

    return (
        <span className={`priority-badge priority-${normalizedPriority.toLowerCase()}`}>
            {normalizedPriority}
        </span>
    );
};

export default PriorityBadge;
