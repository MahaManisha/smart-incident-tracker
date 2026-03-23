const mongoose = require('mongoose');
const { createNotification } = require('./services/notificationService');
const User = require('./models/user');
const Notification = require('./models/Notification');
require('dotenv').config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smart-incident-tracker');
    
    // Test creating the exact same notification parameter
    const responder = await User.findOne({ email: '2312025@nec.edu.in' });
    console.log('Got responder:', responder._id);

    const title = 'Incident Assigned to You';
    const message = 'You have been assigned to incident INC-1234: Test incident. SLA deadline: Invalid Date';
    
    console.log('Calling createNotification directly...');
    const result = await createNotification(
       responder._id,
       'INCIDENT_ASSIGNED',
       new mongoose.Types.ObjectId(), // Fake incident ID
       title,
       message
    );
    console.log('SUCCESS:', result._id);
    
    process.exit(0);
  } catch (err) {
    console.error('FAILED TO CREATE NOTIFICATION:', err);
    process.exit(1);
  }
};
run();
