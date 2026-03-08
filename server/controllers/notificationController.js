const Notification = require('../models/Notification');

// Get user notifications
const getUserNotifications = async (req, res) => {
  try {
    const { unreadOnly } = req.query;
    const query = { user: req.user.id };

    if (unreadOnly === 'true') {
      query.read = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(50); // Limit to last 50 notifications

    const unreadCount = await Notification.countDocuments({
      user: req.user.id,
      read: false
    });

    res.json({
      notifications,
      unreadCount
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
};

// Mark as read
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    if (id === 'all') {
      await Notification.updateMany(
        { user: req.user.id, read: false },
        { read: true }
      );
    } else {
      const notification = await Notification.findOne({
        _id: id,
        user: req.user.id
      });

      if (!notification) {
        return res.status(404).json({ message: 'Notification not found' });
      }

      notification.read = true;
      await notification.save();
    }

    res.json({ message: 'Marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Failed to update notification' });
  }
};

module.exports = {
  getUserNotifications,
  markAsRead
};