const SLA = require('../models/SLA');
const Incident = require('../models/Incident');

/**
 * Find the most specific SLA policy applicable to an incident
 */
const findApplicableSLA = async (incident) => {
  // 1. Fetch all active policies
  const policies = await SLA.find({ isActive: true }).sort({ version: -1 });

  // 2. Filter matching policies
  // Priority: Department + Service > Department > Service > Global
  let bestMatch = null;
  let maxScore = -1;

  for (const policy of policies) {
    let score = 0;
    const scope = policy.scope || {};

    // Check Incident Type
    if (scope.incidentType && scope.incidentType !== 'ALL') {
      // Assuming incident doesn't have type yet, but if it did:
      // if (incident.type !== scope.incidentType) continue; 
      // For now, treat as wildcard or strict match if we had the field
    }

    // Check Department
    if (scope.department && scope.department !== 'ALL') {
      // Need to fetch user department or assume incident has context
      // For simplified logic: if policy specific department, give points
      // In real app, check incident.reportedBy.department
    } else {
      // 'ALL' department is score 0
    }

    // Check Service
    if (scope.service && scope.service !== 'ALL') {
      if (incident.affectedService === scope.service) {
        score += 10;
      } else {
        continue; // Mismatch service
      }
    } else {
      score += 1; // Generic service match
    }

    // Pick highest scoring (most specific) policy
    if (score > maxScore) {
      maxScore = score;
      bestMatch = policy;
    }
  }

  // Fallback: Just pick the first default/global one or ANY active one if no specific logic matches
  if (!bestMatch && policies.length > 0) {
    bestMatch = policies.find(p => p.scope.service === 'ALL' && p.scope.department === 'ALL') || policies[0];
  }

  return bestMatch;
};

/**
 * Calculate Deadlines based on Policy and Incident creation time
 */
const calculateDeadlines = (policy, incident) => {
  // Use new Priority-based SLA constraints if available
  if (incident.priority) {
    const priorityTimes = {
      'P0': { response: 5, resolution: 30 },
      'P1': { response: 15, resolution: 60 },
      'P2': { response: 60, resolution: 240 },
      'P3': { response: 240, resolution: 1440 }
    };
    const times = priorityTimes[incident.priority] || priorityTimes['P3'];
    const startTime = incident.reportedAt ? new Date(incident.reportedAt) : new Date();

    return {
      responseDeadline: new Date(startTime.getTime() + times.response * 60000),
      resolutionDeadline: new Date(startTime.getTime() + times.resolution * 60000),
      target: { priority: incident.priority, responseTimeMinutes: times.response, resolutionTimeMinutes: times.resolution }
    };
  }

  if (!policy || !policy.targets) return { response: null, resolution: null };

  // Find target for specific priority
  const target = policy.targets.find(t => t.priority === incident.severity);

  if (!target) return { response: null, resolution: null };

  const startTime = incident.reportedAt ? new Date(incident.reportedAt) : new Date();

  // Future: Handle Business Hours / Calendar here
  // For now: Simple 24/7 add

  const responseDeadline = new Date(startTime.getTime() + target.responseTimeMinutes * 60000);
  const resolutionDeadline = new Date(startTime.getTime() + target.resolutionTimeMinutes * 60000);

  return {
    responseDeadline,
    resolutionDeadline,
    target
  };
};

/**
 * Attach SLA to Incident (Mutates incident, does NOT save)
 */
const attachSLA = async (incident) => {
  const policy = await findApplicableSLA(incident);
  
  // Calculate deadlines using either the found policy or the priority-based fallback
  const { responseDeadline, resolutionDeadline } = calculateDeadlines(policy, incident);

  if (policy) {
    incident.slaPolicy = policy._id;
  }
  
  // Always set deadlines based on priority even if no DB policy exists
  incident.slaResponseDeadline = responseDeadline;
  incident.slaResolutionDeadline = resolutionDeadline;

  // Reset statuses
  incident.slaResponseStatus = 'PENDING';
  incident.slaResolutionStatus = 'PENDING';
  incident.slaStatus = 'PENDING';

  if (policy) {
    console.log(`Attached SLA policy '${policy.name}' to Incident ${incident._id}`);
  } else {
    console.log(`Attached default priority-based SLA to Incident ${incident._id}`);
  }
};

/**
 * Check Breach Status (Can be run periodically or on specific events)
 */
const checkSLABreached = (incident) => {
  const now = new Date();
  let changed = false;

  // Check Response Time
  if (incident.slaResponseStatus === 'PENDING' && incident.slaResponseDeadline) {
    if (now > incident.slaResponseDeadline) {
      incident.slaResponseStatus = 'BREACHED';
      incident.slaStatus = 'BREACHED'; // Overall breach
      incident.slaBreachLog.push({
        type: 'RESPONSE',
        breachedAt: now,
        timeOverdueMs: now - incident.slaResponseDeadline
      });
      changed = true;
    }
  }

  // Check Resolution Time
  if (incident.slaResolutionStatus === 'PENDING' && incident.slaResolutionDeadline) {
    if (now > incident.slaResolutionDeadline) {
      incident.slaResolutionStatus = 'BREACHED';
      incident.slaStatus = 'BREACHED';
      incident.slaBreachLog.push({
        type: 'RESOLUTION',
        breachedAt: now,
        timeOverdueMs: now - incident.slaResolutionDeadline
      });
      changed = true;
    }
  }

  return changed;
};

/**
 * Helper: Calculate Resolution Time in Minutes
 */
const calculateResolutionTime = (incident) => {
  if (!incident.reportedAt || !incident.resolvedAt) return null;
  const start = new Date(incident.reportedAt).getTime();
  const end = new Date(incident.resolvedAt).getTime();
  return (end - start) / 60000; // minutes
};

/**
 * Helper: Check if Incident Met SLA
 */
const isSLAMet = (incident) => {
  // If overall status is MET, then true.
  if (incident.slaStatus === 'MET') return true;
  // If specific resolution status is MET, we can count it as met for resolution stats
  if (incident.slaResolutionStatus === 'MET') return true;

  // Backward compatibility check if fields missing
  if (incident.slaResolutionDeadline && incident.resolvedAt) {
    return incident.resolvedAt <= incident.slaResolutionDeadline;
  }

  return false;
};

// Placeholder for full SLA compliance metrics report to avoid crash in analytics logic
const getSLAComplianceMetrics = async (startDate, endDate) => {
  // Simple stub for now - in full implementation this would run aggregations
  const total = await Incident.countDocuments({
    createdAt: { $gte: startDate, $lte: endDate }
  });

  // This is a minimal implementation to satisfy the export function call
  return {
    total,
    met: 0,
    breached: 0,
    complianceRate: 0
  };
};

module.exports = {
  findApplicableSLA,
  calculateDeadlines,
  attachSLA,
  checkSLABreached,
  calculateResolutionTime,
  isSLAMet,
  getSLAComplianceMetrics
};