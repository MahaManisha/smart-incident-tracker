const mongoose = require('mongoose');
const Notification = require('./models/Notification');
const User = require('./models/user');
require('dotenv').config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smart-incident-tracker');
    
    // Simulate req.user
    const req = {
      user: await User.findOne({ email: '2312025@nec.edu.in' })
    };
    
    console.log('Logged in user:', req.user._id);
    
    // Simulate getUserNotifications
    const query = { user: req.user._id };
    
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(50);
      
    const unreadCount = await Notification.countDocuments({
      user: req.user._id,
      read: false
    });
    
    console.log('Notifications length:', notifications.length);
    console.log('Unread count:', unreadCount);
    if(notifications.length > 0) {
      console.log('First notification title:', notifications[0].title);
    }
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};
run();
