const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateProfile,
  changePassword,
  getUserStats,
  logoutAll
} = require('../controllers/userController');
const { verifyToken, isAdmin } = require('../middleware/auth');
const { userValidation, validate, paramValidation, queryValidation } = require('../middleware/validation');
const { auditMiddleware } = require('../middleware/auditLogger');

// --------------------
// Routes
// --------------------

// Get all users - Authenticated users
router.get(
  '/',
  verifyToken,
  queryValidation.pagination,
  validate,
  getAllUsers
);

const upload = require('../middleware/upload');

// Update own profile - Authenticated user
router.put(
  '/profile',
  verifyToken,
  upload.single('profileImage'), // Handle file upload
  userValidation.updateProfile,
  validate,
  updateProfile
);

// Change password - Authenticated user (✅ Changed from POST to PUT)
router.put(
  '/change-password',
  verifyToken,
  userValidation.changePassword,
  validate,
  changePassword
);

// Logout from all sessions - Authenticated user
router.post(
  '/logout-all',
  verifyToken,
  logoutAll
);

// Get user stats - Admin or self
router.get(
  '/:id/stats',
  verifyToken,
  paramValidation.mongoId,
  validate,
  getUserStats
);

// Get user by ID - Admin or self
router.get(
  '/:id',
  verifyToken,
  paramValidation.mongoId,
  validate,
  getUserById
);

// Create user - Admin only
router.post(
  '/',
  verifyToken,
  isAdmin,
  userValidation.create,
  validate,
  auditMiddleware('Created User'),
  createUser
);

// Update user - Admin only
router.put(
  '/:id',
  verifyToken,
  isAdmin,
  paramValidation.mongoId,
  userValidation.update,
  validate,
  auditMiddleware('Updated User'),
  updateUser
);

// Delete user (soft delete) - Admin only
router.delete(
  '/:id',
  verifyToken,
  isAdmin,
  paramValidation.mongoId,
  validate,
  auditMiddleware('Deleted User'),
  deleteUser
);

module.exports = router;