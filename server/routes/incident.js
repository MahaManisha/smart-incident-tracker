const express = require('express');
const router = express.Router();
const {
  createIncident,
  getAllIncidents,
  getIncidentById,
  assignIncident,
  updateIncidentStatus,
  addComment
} = require('../controllers/incidentController');
const { verifyToken, isAdmin } = require('../middleware/auth');
const { incidentValidation, validate, paramValidation } = require('../middleware/validation');
const { auditMiddleware } = require('../middleware/auditLogger');

// ============================================
// CREATE INCIDENT - ADMIN, REPORTER (any authenticated user can create)
// ============================================
router.post(
  '/',
  verifyToken,                    // 1. Authentication FIRST
  incidentValidation.create,      // 2. Validation rules
  validate,                       // 3. Validation checker
  createIncident                  // 4. Controller
);

// ============================================
// GET ALL INCIDENTS - All authenticated users
// ============================================
router.get(
  '/',
  verifyToken,
  getAllIncidents
);

// ============================================
// GET INCIDENT BY ID
// ============================================
router.get(
  '/:id',
  verifyToken,
  paramValidation.mongoId,
  validate,
  getIncidentById
);

// ============================================
// ASSIGN INCIDENT - Admin only
// ============================================
router.put(
  '/:id/assign',
  verifyToken,
  isAdmin,
  paramValidation.mongoId,
  incidentValidation.assign,
  validate,
  auditMiddleware('Assigned Incident'),
  assignIncident
);

// ============================================
// UPDATE INCIDENT STATUS - Responder or Admin
// ============================================
router.put(
  '/:id/status',
  verifyToken,
  paramValidation.mongoId,
  incidentValidation.updateStatus,
  validate,
  auditMiddleware('Updated Incident Status'),
  updateIncidentStatus
);

// ============================================
// ADD COMMENT TO INCIDENT
// ============================================
router.post(
  '/:id/comments',
  verifyToken,
  paramValidation.mongoId,
  incidentValidation.addComment,
  validate,
  auditMiddleware('Added Comment'),
  addComment
);

module.exports = router;