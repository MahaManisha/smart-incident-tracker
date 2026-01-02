const express = require('express');
const router = express.Router();
const {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount
} = require('../controllers/notificationController');
const { verifyToken } = require('../middleware/auth');
const { paramValidation, queryValidation, validate } = require('../middleware/validation');

// Get user notifications
router.get(
  '/',
  verifyToken,
  queryValidation.pagination,
  validate,
  getUserNotifications
);

// Get unread count
router.get(
  '/unread-count',
  verifyToken,
  getUnreadCount
);

// Mark notification as read
router.patch(
  '/:id/read',
  verifyToken,
  paramValidation.mongoId,
  validate,
  markAsRead
);

// Mark all notifications as read
router.patch(
  '/read-all',
  verifyToken,
  markAllAsRead
);

// Delete notification
router.delete(
  '/:id',
  verifyToken,
  paramValidation.mongoId,
  validate,
  deleteNotification
);

module.exports = router;