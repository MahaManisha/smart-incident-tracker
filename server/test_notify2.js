const mongoose = require('mongoose');
const { notifyIncidentAssigned } = require('./services/notificationService');
const User = require('./models/user');
require('dotenv').config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smart-incident-tracker');
    
    const responder = await User.findOne({ email: '2312025@nec.edu.in' });
    
    // Fake incident
    const fakeIncident = {
       _id: new mongoose.Types.ObjectId(),
       incidentNumber: 'INC-9999',
       title: 'Test Title',
       slaDeadline: new Date(),
       description: 'Test Description',
       priority: 'P1'
    };
    
    console.log('Calling notifyIncidentAssigned...');
    await notifyIncidentAssigned(fakeIncident, responder);
    console.log('SUCCESS');
    
    process.exit(0);
  } catch (err) {
    console.error('FAILED TO CREATE NOTIFICATION:', err);
    process.exit(1);
  }
};
run();
