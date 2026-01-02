const Incident = require('../models/Incident');
const User = require('../models/user');
const { calculateResolutionTime, isSLAMet } = require('./slaService');

// Calculate dashboard metrics
const calculateDashboardMetrics = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Count incidents by status
    const openCount = await Incident.countDocuments({ status: 'OPEN' });
    const assignedCount = await Incident.countDocuments({ status: 'ASSIGNED' });
    const investigatingCount = await Incident.countDocuments({ status: 'INVESTIGATING' });
    const resolvedTodayCount = await Incident.countDocuments({
      status: { $in: ['RESOLVED', 'CLOSED'] },
      resolvedAt: { $gte: today, $lt: tomorrow }
    });

    // Count SLA breaches
    const slaBreachCount = await Incident.countDocuments({
      slaStatus: 'BREACHED'
    });

    // Get incidents by severity
    const bySeverity = await Incident.aggregate([
      {
        $match: {
          status: { $nin: ['CLOSED'] }
        }
      },
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 }
        }
      }
    ]);

    // Calculate average resolution time for resolved incidents in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const resolvedIncidents = await Incident.find({
      status: { $in: ['RESOLVED', 'CLOSED'] },
      resolvedAt: { $gte: thirtyDaysAgo }
    });

    let totalResolutionTime = 0;
    resolvedIncidents.forEach(incident => {
      const time = calculateResolutionTime(incident);
      if (time) totalResolutionTime += time;
    });

    const avgResolutionTime = resolvedIncidents.length > 0 
      ? Math.round(totalResolutionTime / resolvedIncidents.length / 60) // in hours
      : 0;

    // Get recent incidents (last 10)
    const recentIncidents = await Incident.find()
      .sort({ reportedAt: -1 })
      .limit(10)
      .populate('reporter', 'name email')
      .populate('responder', 'name email')
      .select('incidentNumber title severity status reportedAt slaDeadline');

    return {
      openIncidents: openCount,
      assignedIncidents: assignedCount,
      inProgress: investigatingCount,
      resolvedToday: resolvedTodayCount,
      slaBreaches: slaBreachCount,
      avgResolutionTimeHours: avgResolutionTime,
      incidentsBySeverity: {
        CRITICAL: bySeverity.find(s => s._id === 'CRITICAL')?.count || 0,
        HIGH: bySeverity.find(s => s._id === 'HIGH')?.count || 0,
        MEDIUM: bySeverity.find(s => s._id === 'MEDIUM')?.count || 0,
        LOW: bySeverity.find(s => s._id === 'LOW')?.count || 0
      },
      recentIncidents
    };
  } catch (error) {
    console.error('Error calculating dashboard metrics:', error);
    throw error;
  }
};

// Get incident trends
const getIncidentTrends = async (period = '7d') => {
  try {
    const daysMap = {
      '7d': 7,
      '30d': 30,
      '90d': 90
    };
    
    const days = daysMap[period] || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const incidents = await Incident.find({
      reportedAt: { $gte: startDate }
    });

    // Group by date
    const trendData = {};
    
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      trendData[dateStr] = {
        date: dateStr,
        created: 0,
        resolved: 0,
        bySeverity: {
          CRITICAL: 0,
          HIGH: 0,
          MEDIUM: 0,
          LOW: 0
        }
      };
    }

    incidents.forEach(incident => {
      const reportedDate = new Date(incident.reportedAt).toISOString().split('T')[0];
      if (trendData[reportedDate]) {
        trendData[reportedDate].created++;
        trendData[reportedDate].bySeverity[incident.severity]++;
      }

      if (incident.resolvedAt) {
        const resolvedDate = new Date(incident.resolvedAt).toISOString().split('T')[0];
        if (trendData[resolvedDate]) {
          trendData[resolvedDate].resolved++;
        }
      }
    });

    return Object.values(trendData);
  } catch (error) {
    console.error('Error getting incident trends:', error);
    throw error;
  }
};

// Get responder performance
const getResponderPerformance = async () => {
  try {
    const responders = await User.find({ 
      role: 'RESPONDER', 
      isActive: true 
    });

    const performanceData = await Promise.all(
      responders.map(async (responder) => {
        const assignedIncidents = await Incident.find({
          responder: responder._id
        });

        const resolvedIncidents = assignedIncidents.filter(
          inc => inc.status === 'RESOLVED' || inc.status === 'CLOSED'
        );

        const currentWorkload = assignedIncidents.filter(
          inc => ['ASSIGNED', 'INVESTIGATING'].includes(inc.status)
        ).length;

        let totalResolutionTime = 0;
        let metSLA = 0;

        resolvedIncidents.forEach(incident => {
          const time = calculateResolutionTime(incident);
          if (time) totalResolutionTime += time;
          
          if (isSLAMet(incident)) metSLA++;
        });

        const avgResolutionTime = resolvedIncidents.length > 0
          ? Math.round(totalResolutionTime / resolvedIncidents.length / 60) // in hours
          : 0;

        const slaComplianceRate = resolvedIncidents.length > 0
          ? ((metSLA / resolvedIncidents.length) * 100).toFixed(2)
          : 0;

        return {
          responderId: responder._id,
          name: responder.name,
          email: responder.email,
          assignedIncidents: assignedIncidents.length,
          resolvedIncidents: resolvedIncidents.length,
          currentWorkload,
          avgResolutionTimeHours: avgResolutionTime,
          slaComplianceRate: parseFloat(slaComplianceRate)
        };
      })
    );

    // Sort by SLA compliance rate descending
    performanceData.sort((a, b) => b.slaComplianceRate - a.slaComplianceRate);

    return performanceData;
  } catch (error) {
    console.error('Error getting responder performance:', error);
    throw error;
  }
};

// Get incidents by type/category
const getIncidentsByCategory = async () => {
  try {
    const incidents = await Incident.aggregate([
      {
        $group: {
          _id: '$affectedService',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]);

    return incidents.map(item => ({
      category: item._id || 'Uncategorized',
      count: item.count
    }));
  } catch (error) {
    console.error('Error getting incidents by category:', error);
    throw error;
  }
};

module.exports = {
  calculateDashboardMetrics,
  getIncidentTrends,
  getResponderPerformance,
  getIncidentsByCategory
};