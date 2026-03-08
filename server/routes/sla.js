const express = require('express');
const router = express.Router();
const {
  createSLARule,
  getAllSLARules,
  getSLARuleById,
  updateSLARule,
  activateSLARule,
  deleteSLARule,
} = require('../controllers/slaController');
const { verifyToken, isAdmin } = require('../middleware/auth');
const { slaValidation, validate, paramValidation } = require('../middleware/validation');
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

// Get all SLA rules - All authenticated users (Admin/Responder/Reporter)
router.get(
  '/',
  verifyToken,
  getAllSLARules
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

// Activate/Deactivate SLA rule - Admin only
router.patch(
  '/:id/activate',
  verifyToken,
  isAdmin,
  paramValidation.mongoId,
  validate,
  auditMiddleware('Toggled SLA Activation'),
  activateSLARule
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