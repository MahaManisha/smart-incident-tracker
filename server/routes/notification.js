const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { getUserNotifications, markAsRead } = require('../controllers/notificationController');

// All routes require authentication
router.use(verifyToken);

// Get notifications
router.get('/', getUserNotifications);

// Mark as read (specific ID or 'all')
router.put('/:id/read', markAsRead);

module.exports = router;