const Notification = require('../models/Notification');

// Get user notifications
const getUserNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, isRead } = req.query;
    
    const query = { userId: req.user.id };
    if (isRead !== undefined) {
      query.isRead = isRead === 'true';
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const notifications = await Notification.find(query)
      .populate('incidentId', 'incidentNumber title severity status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ 
      userId: req.user.id, 
      isRead: false 
    });
    
    res.json({
      notifications,
      unreadCount,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ 
      message: 'Error fetching notifications', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

// Mark notification as read
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    // Check ownership
    if (notification.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    notification.isRead = true;
    await notification.save();
    
    res.json({
      message: 'Notification marked as read',
      notification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ 
      message: 'Error marking notification as read', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

// Mark all notifications as read
const markAllAsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { userId: req.user.id, isRead: false },
      { $set: { isRead: true } }
    );
    
    res.json({
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ 
      message: 'Error marking all notifications as read', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

// Delete notification
const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    // Check ownership
    if (notification.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    await notification.deleteOne();
    
    res.json({
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ 
      message: 'Error deleting notification', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

// Get unread count
const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ 
      userId: req.user.id, 
      isRead: false 
    });
    
    res.json({ unreadCount: count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ 
      message: 'Error fetching unread count', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

module.exports = {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount
};