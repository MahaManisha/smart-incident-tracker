const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getIncidentTrendsData,
  getResponderPerformanceData,
  getSLAReport,
  getIncidentsByType,
  exportReport
} = require('../controllers/analyticsController');
const { verifyToken, isAdmin, isResponderOrAdmin } = require('../middleware/auth');
const { queryValidation, validate } = require('../middleware/validation');

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

// Export report - Admin only
router.post(
  '/export',
  verifyToken,
  isAdmin,
  exportReport
);

module.exports = router;