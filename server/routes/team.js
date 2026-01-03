const express = require('express');
const router = express.Router();
const { verifyToken, authorize } = require('../middleware/auth');
const {
  getAllTeams,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam,
  addTeamMember,
  removeTeamMember,
} = require('../controllers/teamController');

// Apply authentication to all routes
router.use(verifyToken);

// GET /api/teams - Get all teams
router.get('/', authorize('ADMIN', 'RESPONDER'), getAllTeams);

// GET /api/teams/:id - Get single team
router.get('/:id', authorize('ADMIN', 'RESPONDER'), getTeamById);

// POST /api/teams - Create new team
router.post('/', authorize('ADMIN'), createTeam);

// PATCH /api/teams/:id - Update team
router.patch('/:id', authorize('ADMIN'), updateTeam);

// DELETE /api/teams/:id - Delete team
router.delete('/:id', authorize('ADMIN'), deleteTeam);

// POST /api/teams/:id/members - Add member to team
router.post('/:id/members', authorize('ADMIN'), addTeamMember);

// DELETE /api/teams/:id/members/:userId - Remove member from team
router.delete('/:id/members/:userId', authorize('ADMIN'), removeTeamMember);

module.exports = router;