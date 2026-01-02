const { 
  calculateDashboardMetrics, 
  getIncidentTrends, 
  getResponderPerformance,
  getIncidentsByCategory 
} = require('../services/analyticsService');
const { getSLAComplianceMetrics } = require('../services/slaService');
const Incident = require('../models/Incident');

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    const metrics = await calculateDashboardMetrics();
    
    // Filter data based on role
    if (req.user.role === 'RESPONDER') {
      // Responders see only their stats
      const responderIncidents = await Incident.find({ 
        responder: req.user.id 
      });
      
      metrics.openIncidents = responderIncidents.filter(inc => inc.status === 'OPEN').length;
      metrics.assignedIncidents = responderIncidents.filter(inc => inc.status === 'ASSIGNED').length;
      metrics.inProgress = responderIncidents.filter(inc => inc.status === 'INVESTIGATING').length;
      metrics.recentIncidents = responderIncidents.slice(0, 10);
    }
    
    res.json({
      metrics
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
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

// Export report (placeholder for CSV/PDF generation)
const exportReport = async (req, res) => {
  try {
    const { reportType, format, filters } = req.body;
    
    // This is a placeholder - you would implement actual CSV/PDF generation here
    // using libraries like 'json2csv' or 'pdfkit'
    
    let data;
    
    switch (reportType) {
      case 'dashboard':
        data = await calculateDashboardMetrics();
        break;
      case 'sla':
        const start = filters?.startDate ? new Date(filters.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = filters?.endDate ? new Date(filters.endDate) : new Date();
        data = await getSLAComplianceMetrics(start, end);
        break;
      case 'responder':
        data = await getResponderPerformance();
        break;
      default:
        return res.status(400).json({ message: 'Invalid report type' });
    }
    
    if (format === 'json') {
      return res.json({ data });
    }
    
    // For CSV/PDF, you would generate the file here and send it
    res.json({ 
      message: 'Export functionality to be implemented with CSV/PDF generation',
      data 
    });
  } catch (error) {
    console.error('Error exporting report:', error);
    res.status(500).json({ 
      message: 'Error exporting report', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

module.exports = {
  getDashboardStats,
  getIncidentTrendsData,
  getResponderPerformanceData,
  getSLAReport,
  getIncidentsByType,
  exportReport
};