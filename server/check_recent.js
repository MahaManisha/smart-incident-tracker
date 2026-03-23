const mongoose = require('mongoose');
const Notification = require('./models/Notification');
const User = require('./models/user');
require('dotenv').config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smart-incident-tracker');
    
    const responder = await User.findOne({ email: '2312025@nec.edu.in' });
    
    // Check notifications from last 24 hours
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const recentNotifs = await Notification.find({ 
      user: responder._id,
      createdAt: { $gte: yesterday }
    });
    
    console.log(`Found ${recentNotifs.length} recent notifications for ${responder.email}`);
    recentNotifs.forEach(n => console.log(`- ${n.type}: ${n.title}`));
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};
run();
