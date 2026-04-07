const Incident = require('../models/Incident');
const User = require('../models/User');
const Service = require('../models/Service');
const Documentation = require('../models/Documentation');
const { getImpactedServices } = require('./serviceImpactService');
const { GoogleGenAI } = require('@google/genai');

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

/**
 * AI-Driven Topology Generation
 * Analyzes incident context (title, description) and available services
 * to generate a likely failure propagation path.
 */
const generateAIIncidentTopology = async (incidentId) => {
    const incident = await Incident.findById(incidentId).populate('serviceId');
    if (!incident) throw new Error('Incident not found');

    const allServices = await Service.find();
    let rootCauseIds = [];
    let propagationPathIds = [];
    let analysisText = "";
    let confidence = 75;
    let suggestedFix = null;
    let suggestedDocId = null;

    if (process.env.GEMINI_API_KEY) {
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
            const docs = await Documentation.find().select('_id title rootCause resolutionSteps');
            
            const prompt = `
            You are a Site Reliability Engineer AI Engine. 
            Analyze the following Incident and map its topology, suggest a fix, and pair it with any existing documentation.
            
            Incident Details:
            Title: ${incident.title}
            Description: ${incident.description}
            Category: ${incident.type}

            Available Services in System:
            ${JSON.stringify(allServices.map(s => ({ id: s._id, name: s.name, type: s.type })))}

            Available Internal Documentation:
            ${JSON.stringify(docs.map(d => ({ id: d._id, title: d.title, resolve: d.resolutionSteps })))}

            Return ONLY a valid JSON object matching exactly this structure (no markdown fences, no other text):
            {
                "rootCauseServiceIds": ["string array of service ids likely to be the root causes based on incident text"],
                "propagationServiceIds": ["string array of service ids that would be downstream impacted"],
                "topologyEdges": [
                    { "source": "serviceId", "target": "serviceId", "label": "HARD or SOFT" }
                ],
                "analysis": "Detailed engineering explanation of how the failure propagated.",
                "suggestedFix": "A comprehensive step-by-step resolution strategy, similar to what chatgpt would suggest for this type of failure.",
                "suggestedDocumentationId": "If an available document exactly matches or helps, string of doc ID, otherwise null"
            }
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: { responseMimeType: "application/json" }
            });
            const result = JSON.parse(response.text);

            rootCauseIds = result.rootCauseServiceIds || [];
            propagationPathIds = result.propagationServiceIds || [];
            analysisText = result.analysis;
            suggestedFix = result.suggestedFix;
            suggestedDocId = result.suggestedDocumentationId;
            confidence = 96;
            
            if(suggestedFix) {
                incident.aiSuggestedFix = suggestedFix;
                await incident.save();
            }
            
            // Return raw dynamic edges to the controller so it overrides the DB
            return {
                incidentId: incident._id,
                analysis: analysisText,
                confidence,
                rootCauseIds,
                propagationPathIds,
                suggestedDocId,
                aiGeneratedEdges: result.topologyEdges || [],
                isAIGenerated: true,
                generatedAt: new Date()
            };
        } catch (error) {
            console.error("LLM Generation Failed, falling back to heuristic:", error.message);
        }
    }

    // Fallback if LLM failed or no API key is provided
    if (rootCauseIds.length === 0) {
        const incidentText = (incident.title + " " + (incident.description || "")).toLowerCase();
        rootCauseIds = allServices
            .filter(s => (s.name && incidentText.includes(s.name.toLowerCase())) || 
                         (incident.serviceId && s._id.toString() === incident.serviceId._id.toString()))
            .map(s => s._id.toString());

        const impactedByAnalysis = await getImpactedServices(rootCauseIds[0] || incident.serviceId?._id);
        propagationPathIds = impactedByAnalysis.map(s => s._id.toString());
        confidence = incidentText.length > 50 ? 92 : 75;
        
        // Mock ChatGPT-like response behavior if no API Key is provided
        analysisText = `Simulated AI Analysis: Based on heuristic classification of "${incident.title}", the language heuristics identify a primary fault point propagating to downstream dependencies. Real LLM inference is currently missing API keys.`;
        
        suggestedFix = `1. Isolate the affected ${rootCauseIds.length} root services from the load balancer.\n2. Verify the configuration variables and restart the containers.\n3. Monitor the ${propagationPathIds.length} downstream components for recovery.\n4. Run integration tests to ensure API stability.`;
        
        // Simple heuristic document search
        const docs = await Documentation.find();
        if (docs.length > 0) {
            // Find a document that matches words in the title
            const matchingDoc = docs.find(d => {
                const docTitleText = d.title.toLowerCase();
                // Check if any significant word overlaps
                return docTitleText.includes(incidentText) || incidentText.includes(docTitleText);
            });
            if (matchingDoc) {
                suggestedDocId = matchingDoc._id.toString();
            }
        }

        if (suggestedFix) {
            incident.aiSuggestedFix = suggestedFix;
            await incident.save();
        }
    }

    return {
        incidentId: incident._id,
        analysis: analysisText,
        confidence,
        rootCauseIds,
        propagationPathIds,
        suggestedDocId,
        aiGeneratedEdges: [],
        isAIGenerated: true,
        generatedAt: new Date()
    };
};

module.exports = {
    predictSLARisk,
    getAISuggestions,
    clusterIncidents,
    getRecommendedResponders,
    generatePostmortem,
    generateAIIncidentTopology
};
