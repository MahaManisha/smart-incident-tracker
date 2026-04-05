const Incident = require('../models/Incident');
const User = require('../models/User');
const Service = require('../models/Service');
const { getImpactedServices } = require('./serviceImpactService');

/**
 * Predict SLA Breach Risk for an incident
 */
const predictSLARisk = async (incidentId) => {
    const incident = await Incident.findById(incidentId);
    if (!incident || incident.status === 'RESOLVED' || incident.status === 'CLOSED') {
        return { risk: 'LOW', confidence: 100, message: 'Incident resolved or closed.' };
    }

    const deadline = incident.slaResolutionDeadline;
    if (!deadline) return { risk: 'LOW', message: 'No SLA deadline defined.' };

    const now = new Date();
    const timeRemainingMs = deadline - now;

    // Get historical average for same service and priority
    const historicalStats = await Incident.aggregate([
        {
            $match: {
                serviceId: incident.serviceId,
                priority: incident.priority,
                status: { $in: ['RESOLVED', 'CLOSED'] },
                resolvedAt: { $ne: null }
            }
        },
        {
            $project: {
                duration: { $subtract: ["$resolvedAt", "$reportedAt"] }
            }
        },
        {
            $group: {
                _id: null,
                avgDuration: { $avg: "$duration" }
            }
        }
    ]);

    const avgResolutionMs = historicalStats.length > 0 ? historicalStats[0].avgDuration : 3600000 * 2; // Default 2h
    
    let risk = 'LOW';
    if (timeRemainingMs < 0) risk = 'HIGH'; // Already breached
    else if (timeRemainingMs < avgResolutionMs * 0.5) risk = 'HIGH';
    else if (timeRemainingMs < avgResolutionMs) risk = 'MEDIUM';

    // Update incident state
    incident.slaRiskLevel = risk;
    await incident.save();

    return {
        risk,
        timeRemainingMin: Math.round(timeRemainingMs / 60000),
        avgResolutionMin: Math.round(avgResolutionMs / 60000),
        message: risk === 'HIGH' ? 'SLA breach imminent based on historical trends.' : 'On track for resolution.'
    };
};

/**
 * Suggest Root Cause and Fix based on similar past incidents
 */
const getAISuggestions = async (incidentId) => {
    const incident = await Incident.findById(incidentId);
    if (!incident) throw new Error('Incident not found');

    // Find similar resolved incidents in the same service
    const similarIncidents = await Incident.find({
        serviceId: incident.serviceId,
        status: { $in: ['RESOLVED', 'CLOSED'] },
        rootCause: { $ne: null },
        _id: { $ne: incidentId }
    })
    .sort({ createdAt: -1 })
    .limit(3);

    if (similarIncidents.length === 0) {
        return {
            rootCause: "Insufficient historical data for this service.",
            suggestedFix: "Follow standard operating procedures for " + (incident.type || 'general') + " issues."
        };
    }

    // Simple heuristic: Take the most recent similar root cause
    const bestMatch = similarIncidents[0];
    
    const suggestion = {
        rootCause: bestMatch.rootCause,
        suggestedFix: bestMatch.resolutionNotes,
        confidence: 85,
        similarIncidentId: bestMatch._id
    };

    incident.aiSuggestedFix = suggestion.suggestedFix;
    await incident.save();

    return suggestion;
};

/**
 * Auto-Cluster similar active incidents
 */
const clusterIncidents = async () => {
    const activeIncidents = await Incident.find({
        status: { $in: ['OPEN', 'ASSIGNED', 'INVESTIGATING'] }
    });

    const clusters = {};

    activeIncidents.forEach(inc => {
        const key = `${inc.serviceId}_${inc.type}`;
        if (!clusters[key]) clusters[key] = [];
        clusters[key].push(inc);
    });

    const result = [];
    for (const key in clusters) {
        if (clusters[key].length > 1) {
            const incidentIds = clusters[key].map(i => i._id);
            // In a real system, we'd create a Cluster document here
            await Incident.updateMany(
                { _id: { $in: incidentIds } },
                { isClustered: true }
            );
            result.push({
                criteria: key,
                count: clusters[key].length,
                incidents: clusters[key].map(i => ({ id: i._id, title: i.title }))
            });
        }
    }

    return result;
};

/**
 * Smart Assignment for responders
 */
const getRecommendedResponders = async (incidentId) => {
    const incident = await Incident.findById(incidentId);
    if (!incident) throw new Error('Incident not found');

    // Find responders who have resolved incidents for this service before
    const experts = await Incident.aggregate([
        {
            $match: {
                serviceId: incident.serviceId,
                status: { $in: ['RESOLVED', 'CLOSED'] },
                assignedTo: { $ne: null }
            }
        },
        {
            $group: {
                _id: "$assignedTo",
                resolvedCount: { $sum: 1 }
            }
        },
        { $sort: { resolvedCount: -1 } },
        { $limit: 5 }
    ]);

    const expertIds = experts.map(e => e._id);
    const responders = await User.find({
        _id: { $in: expertIds },
        role: 'RESPONDER'
    }).select('name email department');

    return responders.map(r => {
        const stats = experts.find(e => e._id.toString() === r._id.toString());
        return {
            ...r.toObject(),
            experienceScore: stats ? stats.resolvedCount : 0,
            suitability: stats ? (stats.resolvedCount > 5 ? 'EXPERT' : 'MATCH') : 'GENERAL'
        };
    });
};

/**
 * Generate Automated Postmortem Report
 */
const generatePostmortem = async (incidentId) => {
    const incident = await Incident.findById(incidentId)
        .populate('reportedBy', 'name')
        .populate('assignedTo', 'name')
        .populate('serviceId', 'name');

    if (!incident || incident.status !== 'RESOLVED') {
        throw new Error('Only resolved incidents can have postmortems generated.');
    }

    const durationHrs = (incident.resolvedAt - incident.reportedAt) / 3600000;

    return {
        title: `Postmortem: ${incident.title}`,
        service: incident.serviceId?.name,
        timeline: [
            { time: incident.reportedAt, event: 'Incident Detected' },
            { time: incident.assignedAt, event: 'Responder Assigned' },
            { time: incident.resolvedAt, event: 'Resolution Confirmed' }
        ],
        metrics: {
            totalDurationHrs: Math.round(durationHrs * 10) / 10,
            slaStatus: incident.slaStatus
        },
        analysis: {
            rootCause: incident.rootCause || "Under Investigation",
            resolutionSteps: incident.resolutionNotes || "Refer to comments"
        }
    };
};

module.exports = {
    predictSLARisk,
    getAISuggestions,
    clusterIncidents,
    getRecommendedResponders,
    generatePostmortem
};
