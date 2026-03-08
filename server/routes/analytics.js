const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/analyticsController');
const { verifyToken, isAdmin, isResponderOrAdmin } = require('../middleware/auth');
const { queryValidation, validate } = require('../middleware/validation');

// Get reporter-specific dashboard statistics (NEW - must come BEFORE /dashboard)
router.get(
  '/dashboard/my-stats',
  verifyToken,
  getMyDashboardStats
);

// Get dashboard statistics
router.get(
  '/dashboard',
  verifyToken,
  getDashboardStats
);

// Get incident trends
router.get(
  '/trends',
  verifyToken,
  isResponderOrAdmin,
  getIncidentTrendsData
);

// Get responder performance - Admin only
router.get(
  '/responders',
  verifyToken,
  isAdmin,
  getResponderPerformanceData
);

// Get team performance - Admin only
router.get(
  '/teams',
  verifyToken,
  isAdmin,
  getTeamPerformanceData
);

// Get SLA report - Admin only
router.get(
  '/sla-report',
  verifyToken,
  isAdmin,
  queryValidation.dateRange,
  validate,
  getSLAReport
);

// Get incidents by type/category
router.get(
  '/by-type',
  verifyToken,
  isAdmin,
  getIncidentsByType
);



// Get incidents by status
router.get(
  '/by-status',
  verifyToken,
  isAdmin,
  getIncidentsByStatus
);

// Get incidents by severity
router.get(
  '/by-severity',
  verifyToken,
  isAdmin,
  getIncidentsBySeverity
);

// Get priority metrics
router.get(
  '/by-priority',
  verifyToken,
  isAdmin,
  getPriorityMetrics
);

// Get escalation metrics
router.get(
  '/escalations',
  verifyToken,
  isAdmin,
  getEscalationMetrics
);

// Export report - Admin only
router.post(
  '/export',
  verifyToken,
  isAdmin,
  exportReport
);

module.exports = router;