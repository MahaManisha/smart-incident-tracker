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
  getMyAssignedIncidents,
  getIncidentHistory,
  updateIncidentPriority,
  deleteIncident,
  getIncidentInsights,
  getSimilarIncidentsByTitle
} = require('../controllers/incidentController');
const {
  getIncidentTimeline
} = require('../controllers/timelineController');
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

// KB SUGGESTIONS (Search by title)
router.get(
  '/kb/suggest',
  verifyToken,
  getSimilarIncidentsByTitle
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
// GET INCIDENT INSIGHTS
// ============================================
router.get(
  '/:id/insights',
  verifyToken,
  paramValidation.mongoId,
  validate,
  getIncidentInsights
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
// UPDATE INCIDENT PRIORITY - Responder or Admin
// ============================================
router.put(
  '/:id/priority',
  verifyToken,
  paramValidation.mongoId,
  validate,
  auditMiddleware('Updated Incident Priority'),
  updateIncidentPriority
);

// ============================================
// DELETE INCIDENT - Creator or Admin
// ============================================
router.delete(
  '/:id',
  verifyToken,
  paramValidation.mongoId,
  validate,
  auditMiddleware('Deleted Incident'),
  deleteIncident
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

// ============================================
// GET INCIDENT HISTORY
// ============================================
router.get(
  '/:id/history',
  verifyToken,
  paramValidation.mongoId,
  validate,
  getIncidentHistory
);

// ============================================
// GET INCIDENT TIMELINE
// ============================================
router.get(
  '/:incidentId/timeline',
  verifyToken,
  getIncidentTimeline
);

// ============================================
// DOCUMENTATION ROUTES
// ============================================
const {
  getDocumentationByIncidentId,
  updateDocumentation
} = require('../controllers/documentationController');
const documentUpload = require('../middleware/documentUpload');

router.get(
  '/:incidentId/documentation',
  verifyToken,
  authorize('ADMIN', 'RESPONDER'),
  getDocumentationByIncidentId
);


router.put(
  '/:incidentId/documentation',
  verifyToken,
  authorize('ADMIN', 'RESPONDER'),
  (req, res, next) => {
    documentUpload.array('files', 5)(req, res, (err) => {
      if (err) {
        console.error("Multer Error:", err);
        return res.status(400).json({
          success: false,
          message: err.message || 'File upload error',
          error: err.code || 'UPLOAD_ERROR'
        });
      }
      next();
    });
  },
  updateDocumentation
);

module.exports = router;