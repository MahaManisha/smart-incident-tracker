const AuditLog = require('../models/AuditLog');
const Incident = require('../models/Incident');
const User = require('../models/user');
const mongoose = require('mongoose');

/**
 * Get full chronological timeline for an incident
 */
exports.getIncidentTimeline = async (req, res) => {
    try {
        const { incidentId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(incidentId)) {
            return res.status(400).json({ message: 'Invalid incident ID' });
        }

        // Fetch all audit logs for this incident
        // We search by 'incident' field first, fallback to 'target' string comparison
        const logs = await AuditLog.find({
            $or: [
                { incident: incidentId },
                { target: String(incidentId) }
            ]
        })
            .populate('performedBy', 'name role')
            .sort({ createdAt: 1 });

        // Format the logs for the frontend
        const timeline = logs.map(log => {
            let type = 'INFO';
            let message = log.action;

            // Map action types to timeline types
            if (log.action.includes('CREATED')) type = 'CREATED';
            else if (log.action.includes('ASSIGNED')) type = 'ASSIGNED';
            else if (log.action.includes('STATUS')) type = 'STATUS_CHANGED';
            else if (log.action.includes('PRIORITY')) type = 'PRIORITY_CHANGED';
            else if (log.action.includes('ESCALAT')) type = 'ESCALATED';
            else if (log.action.includes('RESOLVED')) type = 'RESOLVED';
            else if (log.action.includes('COMMENT')) type = 'COMMENT';

            // Clean up description from details if available
            const description = log.details?.message || log.details?.description || log.details?.reason || '';

            return {
                id: log._id,
                type,
                action: log.action,
                message: description || log.action.replace(/_/g, ' '),
                user: log.performedBy?.name || 'System',
                userRole: log.performedBy?.role || 'SYSTEM',
                timestamp: log.createdAt,
                details: log.details
            };
        });

        res.json(timeline);
    } catch (error) {
        console.error('Error fetching timeline:', error);
        res.status(500).json({ message: 'Error fetching timeline' });
    }
};
