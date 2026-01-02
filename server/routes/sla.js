const express = require('express');
const router = express.Router();
const {
  createSLARule,
  getAllSLARules,
  getSLARuleById,
  updateSLARule,
  deleteSLARule,
  getSLACompliance
} = require('../controllers/slaController');
const { verifyToken, isAdmin } = require('../middleware/auth');
const { slaValidation, validate, paramValidation, queryValidation } = require('../middleware/validation');
const { auditMiddleware } = require('../middleware/auditLogger');

// Create SLA rule - Admin only
router.post(
  '/',
  verifyToken,
  isAdmin,
  slaValidation.create,
  validate,
  auditMiddleware('Created SLA Rule'),
  createSLARule
);

// Get all SLA rules - All authenticated users
router.get(
  '/',
  verifyToken,
  getAllSLARules
);

// Get SLA compliance report - Admin only
router.get(
  '/compliance',
  verifyToken,
  isAdmin,
  queryValidation.dateRange,
  validate,
  getSLACompliance
);

// Get SLA rule by ID
router.get(
  '/:id',
  verifyToken,
  paramValidation.mongoId,
  validate,
  getSLARuleById
);

// Update SLA rule - Admin only
router.put(
  '/:id',
  verifyToken,
  isAdmin,
  paramValidation.mongoId,
  slaValidation.update,
  validate,
  auditMiddleware('Updated SLA Rule'),
  updateSLARule
);

// Delete SLA rule - Admin only
router.delete(
  '/:id',
  verifyToken,
  isAdmin,
  paramValidation.mongoId,
  validate,
  auditMiddleware('Deleted SLA Rule'),
  deleteSLARule
);

module.exports = router;