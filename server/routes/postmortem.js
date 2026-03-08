const express = require('express');
const router = express.Router();
const {
  createPostmortem,
  getPostmortemByIncident,
  getPostmortemById,
  getAllPostmortems,
  updatePostmortem,
  markPostmortemReviewed,
  deletePostmortem
} = require('../controllers/postmortemController'); // ❌ REMOVED .default
const { verifyToken, isAdmin, isResponderOrAdmin } = require('../middleware/auth');
const { postmortemValidation, validate, paramValidation, queryValidation } = require('../middleware/validation');
const { auditMiddleware } = require('../middleware/auditLogger');

// Create postmortem - Responder or Admin
router.post(
  '/',
  verifyToken,
  isResponderOrAdmin,
  postmortemValidation.create,
  validate,
  auditMiddleware('Created Postmortem'),
  createPostmortem
);

// Get all postmortems - Admin only
router.get(
  '/',
  verifyToken,
  isAdmin,
  queryValidation.pagination,
  validate,
  getAllPostmortems
);

// Get postmortem by incident ID
router.get(
  '/incident/:incidentId',
  verifyToken,
  paramValidation.mongoId,
  validate,
  getPostmortemByIncident
);

// Get postmortem by ID
router.get(
  '/:id',
  verifyToken,
  paramValidation.mongoId,
  validate,
  getPostmortemById
);

// Update postmortem - Submitter or Admin
router.put(
  '/:id',
  verifyToken,
  paramValidation.mongoId,
  postmortemValidation.update,
  validate,
  auditMiddleware('Updated Postmortem'),
  updatePostmortem
);

// Mark postmortem as reviewed - Admin only
router.patch(
  '/:id/review',
  verifyToken,
  isAdmin,
  paramValidation.mongoId,
  validate,
  auditMiddleware('Reviewed Postmortem'),
  markPostmortemReviewed
);

// Delete postmortem - Admin only
router.delete(
  '/:id',
  verifyToken,
  isAdmin,
  paramValidation.mongoId,
  validate,
  auditMiddleware('Deleted Postmortem'),
  deletePostmortem
);

module.exports = router;