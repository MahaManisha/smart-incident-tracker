const SLA = require('../models/SLA');

// Calculate SLA deadline based on severity and creation time
const calculateSLADeadline = async (severity, createdAt) => {
  try {
    const slaRule = await SLA.findOne({ severity });
    
    if (!slaRule) {
      // Default SLA times if no rule exists
      const defaultTimes = {
        CRITICAL: 4,
        HIGH: 8,
        MEDIUM: 24,
        LOW: 48
      };
      const hours = defaultTimes[severity] || 24;
      return new Date(createdAt.getTime() + hours * 60 * 60 * 1000);
    }

    const deadline = new Date(createdAt.getTime() + slaRule.resolutionTimeHours * 60 * 60 * 1000);
    return deadline;
  } catch (error) {
    console.error('Error calculating SLA deadline:', error);
    throw error;
  }
};

// Check SLA status for an incident
const checkSLAStatus = (incident) => {
  try {
    const now = new Date();
    const deadline = new Date(incident.slaDeadline);
    const createdAt = new Date(incident.reportedAt);
    
    const timeRemaining = deadline - now; // in milliseconds
    const totalSLATime = deadline - createdAt;
    
    // If already breached
    if (timeRemaining < 0) {
      return {
        status: 'BREACHED',
        timeRemaining: 0,
        timeRemainingFormatted: 'Overdue'
      };
    }
    
    // If approaching breach (less than 20% time remaining)
    const percentageRemaining = (timeRemaining / totalSLATime) * 100;
    if (percentageRemaining < 20) {
      return {
        status: 'APPROACHING_BREACH',
        timeRemaining: Math.floor(timeRemaining / (1000 * 60)), // in minutes
        timeRemainingFormatted: formatTimeRemaining(timeRemaining)
      };
    }
    
    // Within SLA
    return {
      status: 'WITHIN_SLA',
      timeRemaining: Math.floor(timeRemaining / (1000 * 60)), // in minutes
      timeRemainingFormatted: formatTimeRemaining(timeRemaining)
    };
  } catch (error) {
    console.error('Error checking SLA status:', error);
    throw error;
  }
};

// Calculate response time (acknowledgedAt - reportedAt)
const calculateResponseTime = (incident) => {
  if (!incident.acknowledgedAt) return null;
  
  const reportedAt = new Date(incident.reportedAt);
  const acknowledgedAt = new Date(incident.acknowledgedAt);
  
  const diffInMs = acknowledgedAt - reportedAt;
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  
  return diffInMinutes;
};

// Calculate resolution time (resolvedAt - reportedAt)
const calculateResolutionTime = (incident) => {
  if (!incident.resolvedAt) return null;
  
  const reportedAt = new Date(incident.reportedAt);
  const resolvedAt = new Date(incident.resolvedAt);
  
  const diffInMs = resolvedAt - reportedAt;
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  
  return diffInMinutes;
};

// Check if SLA was met
const isSLAMet = (incident) => {
  if (!incident.resolvedAt) return null;
  
  const resolvedAt = new Date(incident.resolvedAt);
  const deadline = new Date(incident.slaDeadline);
  
  return resolvedAt <= deadline;
};

// Format time remaining in human-readable format
const formatTimeRemaining = (milliseconds) => {
  const minutes = Math.floor(milliseconds / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else {
    return `${minutes}m`;
  }
};

// Get SLA compliance metrics
const getSLAComplianceMetrics = async (startDate, endDate) => {
  try {
    const Incident = require('../models/Incident');
    
    const query = {
      status: { $in: ['RESOLVED', 'CLOSED'] },
      resolvedAt: {
        $gte: startDate,
        $lte: endDate
      }
    };
    
    const incidents = await Incident.find(query);
    
    const total = incidents.length;
    let metCount = 0;
    let breachedCount = 0;
    let totalResponseTime = 0;
    let totalResolutionTime = 0;
    let responseTimeCount = 0;
    let resolutionTimeCount = 0;
    
    const bySeverity = {
      CRITICAL: { total: 0, met: 0, breached: 0 },
      HIGH: { total: 0, met: 0, breached: 0 },
      MEDIUM: { total: 0, met: 0, breached: 0 },
      LOW: { total: 0, met: 0, breached: 0 }
    };
    
    incidents.forEach(incident => {
      const met = isSLAMet(incident);
      if (met) {
        metCount++;
        bySeverity[incident.severity].met++;
      } else {
        breachedCount++;
        bySeverity[incident.severity].breached++;
      }
      
      bySeverity[incident.severity].total++;
      
      const responseTime = calculateResponseTime(incident);
      if (responseTime !== null) {
        totalResponseTime += responseTime;
        responseTimeCount++;
      }
      
      const resolutionTime = calculateResolutionTime(incident);
      if (resolutionTime !== null) {
        totalResolutionTime += resolutionTime;
        resolutionTimeCount++;
      }
    });
    
    return {
      total,
      met: metCount,
      breached: breachedCount,
      complianceRate: total > 0 ? ((metCount / total) * 100).toFixed(2) : 0,
      avgResponseTimeMinutes: responseTimeCount > 0 ? Math.round(totalResponseTime / responseTimeCount) : 0,
      avgResolutionTimeMinutes: resolutionTimeCount > 0 ? Math.round(totalResolutionTime / resolutionTimeCount) : 0,
      bySeverity
    };
  } catch (error) {
    console.error('Error calculating SLA compliance metrics:', error);
    throw error;
  }
};

module.exports = {
  calculateSLADeadline,
  checkSLAStatus,
  calculateResponseTime,
  calculateResolutionTime,
  isSLAMet,
  formatTimeRemaining,
  getSLAComplianceMetrics
};