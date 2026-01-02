const express = require('express');
const router = express.Router();
const {
  createTeam,
  getAllTeams,
  getTeamById,
  updateTeam,
  deleteTeam,
  addMemberToTeam,
  removeMemberFromTeam,
  getTeamIncidents,
  getTeamStats
} = require('../controllers/teamController');
const { verifyToken, isAdmin } = require('../middleware/auth');
const { teamValidation, validate, paramValidation } = require('../middleware/validation');
const { auditMiddleware } = require('../middleware/auditLogger');

// Create team - Admin only
router.post(
  '/',
  verifyToken,
  isAdmin,
  teamValidation.create,
  validate,
  auditMiddleware('Created Team'),
  createTeam
);

// Get all teams - All authenticated users
router.get(
  '/',
  verifyToken,
  getAllTeams
);

// Get team by ID
router.get(
  '/:id',
  verifyToken,
  paramValidation.mongoId,
  validate,
  getTeamById
);

// Update team - Admin only
router.put(
  '/:id',
  verifyToken,
  isAdmin,
  paramValidation.mongoId,
  teamValidation.update,
  validate,
  auditMiddleware('Updated Team'),
  updateTeam
);

// Delete team - Admin only
router.delete(
  '/:id',
  verifyToken,
  isAdmin,
  paramValidation.mongoId,
  validate,
  auditMiddleware('Deleted Team'),
  deleteTeam
);

// Add member to team - Admin only
router.post(
  '/:id/members',
  verifyToken,
  isAdmin,
  paramValidation.mongoId,
  teamValidation.addMember,
  validate,
  auditMiddleware('Added Team Member'),
  addMemberToTeam
);

// Remove member from team - Admin only
router.delete(
  '/:id/members/:userId',
  verifyToken,
  isAdmin,
  auditMiddleware('Removed Team Member'),
  removeMemberFromTeam
);

// Get team incidents
router.get(
  '/:id/incidents',
  verifyToken,
  paramValidation.mongoId,
  validate,
  getTeamIncidents
);

// Get team statistics
router.get(
  '/:id/stats',
  verifyToken,
  paramValidation.mongoId,
  validate,
  getTeamStats
);

module.exports = router;