const express = require('express');
const router = express.Router();
const {
  createIncident,
  getAllIncidents,
  getUnassignedIncidents,
  getIncidentById,
  assignIncident,
  updateIncidentStatus,
  addComment,
  getComments,
  getMyAssignedIncidents
} = require('../controllers/incidentController');
const { verifyToken, isAdmin, authorize } = require('../middleware/auth');
const { incidentValidation, validate, paramValidation } = require('../middleware/validation');
const { auditMiddleware } = require('../middleware/auditLogger');

// ============================================
// CREATE INCIDENT - ADMIN, REPORTER
// ============================================
router.post(
  '/',
  verifyToken,
  incidentValidation.create,
  validate,
  createIncident
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
// GET MY ASSIGNED INCIDENTS - Responder only
// ✅ NEW ROUTE FOR STEP 1
// ============================================
router.get(
  '/my-assigned',
  verifyToken,
  authorize('RESPONDER'),
  getMyAssignedIncidents
);

// ============================================
// GET UNASSIGNED INCIDENTS - Admin only
// ============================================
router.get(
  '/unassigned',
  verifyToken,
  isAdmin,
  getUnassignedIncidents
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
// GET COMMENTS FOR INCIDENT
// ============================================
router.get(
  '/:id/comments',
  verifyToken,
  paramValidation.mongoId,
  validate,
  getComments
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