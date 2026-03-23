const {
  getUnifiedDashboardStats,
  calculateDashboardMetrics,
  getIncidentTrends,
  getResponderPerformance,
  getTeamPerformance, // ✅ Added
  getIncidentsByCategory
} = require('../services/analyticsService');
const { getSLAComplianceMetrics } = require('../services/slaService');
const Incident = require('../models/Incident');

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    const data = await getUnifiedDashboardStats();

    // Filter data based on role if necessary (Responder view)
    if (req.user.role === 'RESPONDER') {
      // Optional: Filter logic could go here if we want strictly personal stats
    }

    res.json(data);
  } catch (error) {
    console.error('[AnalyticsController] Error fetching dashboard stats:', error);
    res.status(500).json({
      message: 'Error fetching dashboard stats',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get reporter-specific dashboard statistics (NEW)
const getMyDashboardStats = async (req, res) => {
  try {
    // Reporters only see incidents they created
    const myIncidents = await Incident.find({
      reporter: req.user.id
    }).sort({ createdAt: -1 });

    // Calculate reporter-specific metrics
    const total = myIncidents.length;
    const open = myIncidents.filter(inc => inc.status === 'OPEN').length;
    const inProgress = myIncidents.filter(inc =>
      inc.status === 'ASSIGNED' || inc.status === 'INVESTIGATING'
    ).length;
    const resolved = myIncidents.filter(inc => inc.status === 'RESOLVED').length;

    res.json({
      myIncidents: {
        total,
        open,
        inProgress,
        resolved
      },
      recentIncidents: myIncidents.slice(0, 10)
    });
  } catch (error) {
    console.error('Error fetching reporter dashboard stats:', error);
    res.status(500).json({
      message: 'Error fetching dashboard stats',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get incident trends
const getIncidentTrendsData = async (req, res) => {
  try {
    const { period = '7d' } = req.query;

    if (!['7d', '30d', '90d'].includes(period)) {
      return res.status(400).json({ message: 'Invalid period. Use 7d, 30d, or 90d' });
    }

    const trends = await getIncidentTrends(period);

    res.json({
      period,
      trends
    });
  } catch (error) {
    console.error('Error fetching incident trends:', error);
    res.status(500).json({
      message: 'Error fetching incident trends',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get responder performance metrics
const getResponderPerformanceData = async (req, res) => {
  try {
    const performance = await getResponderPerformance();

    res.json({
      responders: performance
    });
  } catch (error) {
    console.error('Error fetching responder performance:', error);
    res.status(500).json({
      message: 'Error fetching responder performance',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get team performance data (Admin only)
const getTeamPerformanceData = async (req, res) => {
  try {
    const performance = await getTeamPerformance();

    res.json({
      teams: performance
    });
  } catch (error) {
    console.error('Error fetching team performance:', error);
    res.status(500).json({
      message: 'Error fetching team performance',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get SLA report
const getSLAReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const report = await getSLAComplianceMetrics(start, end);

    res.json({
      period: {
        startDate: start,
        endDate: end
      },
      report
    });
  } catch (error) {
    console.error('Error generating SLA report:', error);
    res.status(500).json({
      message: 'Error generating SLA report',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get incidents by status
const getIncidentsByStatus = async (req, res) => {
  try {
    const Incident = require('../models/Incident');
    const byStatus = await Incident.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Format for frontend chart
    const formatted = byStatus.map(item => ({
      category: item._id,
      count: item.count
    }));

    res.json({ categories: formatted });
  } catch (error) {
    console.error('Error fetching incidents by status:', error);
    res.status(500).json({ message: 'Error fetching status stats' });
  }
};

// Get incidents by severity
const getIncidentsBySeverity = async (req, res) => {
  try {
    const Incident = require('../models/Incident');
    const bySeverity = await Incident.aggregate([
      { $match: { status: { $nin: ['CLOSED'] } } },
      { $group: { _id: '$severity', count: { $sum: 1 } } }
    ]);

    // Format for frontend chart
    const formatted = bySeverity.map(item => ({
      category: item._id,
      count: item.count
    }));

    res.json({ categories: formatted });
  } catch (error) {
    console.error('Error fetching incidents by severity:', error);
    res.status(500).json({ message: 'Error fetching severity stats' });
  }
};

// Get incidents by type/category
const getIncidentsByType = async (req, res) => {
  try {
    const categories = await getIncidentsByCategory();

    res.json({
      categories
    });
  } catch (error) {
    console.error('Error fetching incidents by type:', error);
    res.status(500).json({
      message: 'Error fetching incidents by type',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Export report
const exportReport = async (req, res) => {
  try {
    const { reportType, format, filters } = req.body;

    let data;
    let csvData = '';
    let filename = `report-${Date.now()}.csv`;

    // 1. Fetch Data based on Report Type
    switch (reportType) {
      case 'dashboard':
        data = await calculateDashboardMetrics();
        filename = `dashboard-report-${Date.now()}.csv`;
        // Convert Metrics Object to CSV (Key, Value)
        csvData += 'Metric,Value\n';
        
        // Flatten summary
        if (data.summary) {
          for (const [key, value] of Object.entries(data.summary)) {
            csvData += `Summary: ${key},${value}\n`;
          }
        }
        
        // Flatten distribution arrays
        if (data.distribution && data.distribution.severity) {
          data.distribution.severity.forEach(item => {
            csvData += `Severity: ${item.category},${item.count}\n`;
          });
        }
        if (data.distribution && data.distribution.status) {
          data.distribution.status.forEach(item => {
            csvData += `Status: ${item.category},${item.count}\n`;
          });
        }

        // Add today's date
        csvData += `Exported At,${new Date().toISOString()}\n`;
        break;

      case 'sla':
        const start = filters?.startDate ? new Date(filters.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = filters?.endDate ? new Date(filters.endDate) : new Date();
        data = await getSLAComplianceMetrics(start, end);
        filename = `sla-report-${Date.now()}.csv`;

        // SLA Data is likely an object with compliance rates. 
        // Let's assume it has 'total', 'met', 'breached', 'rate'
        csvData += 'Metric,Value\n';
        csvData += `Total Incidents,${data.total}\n`;
        csvData += `SLA Met,${data.met}\n`;
        csvData += `SLA Breached,${data.breached}\n`;
        csvData += `Compliance Rate,${data.complianceRate}%\n`;
        break;

      case 'responder':
        data = await getResponderPerformance();
        filename = `responder-performance-${Date.now()}.csv`;
        // Data is array of responders
        if (Array.isArray(data)) {
          csvData += 'Responder Name,Resolved Count,Avg Resolution Time (hrs)\n';
          data.forEach(r => {
            csvData += `${r.name},${r.resolvedCount},${r.avgResolutionTime}\n`;
          });
        }
        break;

      default:
        // Default to dashboard stats if unknown
        data = await calculateDashboardMetrics();
        csvData += 'Metric,Value\n';
        for (const [key, value] of Object.entries(data)) {
          csvData += `${key},${value}\n`;
        }
    }

    if (format === 'json') {
      return res.json({ data });
    }

    // 2. Send CSV Response
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.status(200).send(csvData);

  } catch (error) {
    console.error('Error exporting report:', error);
    res.status(500).json({
      message: 'Error exporting report',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get priority metrics
const getPriorityMetrics = async (req, res) => {
  try {
    const Incident = require('../models/Incident');

    const byPriority = await Incident.aggregate([
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 },
          slaBreaches: {
            $sum: { $cond: [{ $eq: ['$slaStatus', 'BREACHED'] }, 1, 0] }
          },
          totalResolutionTime: {
            $sum: {
              $cond: [
                { $and: [{ $ne: ['$resolvedAt', null] }, { $ne: ['$reportedAt', null] }] },
                { $subtract: ['$resolvedAt', '$reportedAt'] },
                0
              ]
            }
          },
          resolvedCount: {
            $sum: { $cond: [{ $ne: ['$resolvedAt', null] }, 1, 0] }
          }
        }
      }
    ]);

    const formatted = byPriority.map(item => ({
      priority: item._id || 'P3',
      count: item.count,
      slaBreaches: item.slaBreaches,
      avgResolutionTimeMinutes: item.resolvedCount > 0 ? (item.totalResolutionTime / item.resolvedCount / 60000).toFixed(2) : 0
    }));

    // Sort P0 highest
    formatted.sort((a, b) => a.priority.localeCompare(b.priority));

    res.json({ metrics: formatted });
  } catch (error) {
    console.error('Error fetching priority metrics:', error);
    res.status(500).json({ message: 'Error fetching priority metrics' });
  }
};

// Get escalation metrics
const getEscalationMetrics = async (req, res) => {
  try {
    const totalEscalations = await Incident.countDocuments({ isEscalated: true });

    const byLevel = await Incident.aggregate([
      { $match: { isEscalated: true } },
      { $group: { _id: '$escalationLevel', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    const statusBreakdown = await Incident.aggregate([
      { $group: { _id: '$escalationStatus', count: { $sum: 1 } } }
    ]);

    res.json({
      totalEscalations,
      byLevel: byLevel.map(l => ({ level: l._id, count: l.count })),
      statusBreakdown: statusBreakdown.map(s => ({ status: s._id, count: s.count }))
    });
  } catch (error) {
    console.error('Error fetching escalation metrics:', error);
    res.status(500).json({ message: 'Error fetching escalation metrics' });
  }
};

module.exports = {
  getDashboardStats,
  getMyDashboardStats,
  getIncidentTrendsData,
  getResponderPerformanceData,
  getTeamPerformanceData,
  getSLAReport,
  getIncidentsByType,
  getIncidentsBySeverity,
  getIncidentsByStatus, // ✅ Added
  exportReport,
  getPriorityMetrics,
  getEscalationMetrics
};