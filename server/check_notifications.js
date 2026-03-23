const mongoose = require('mongoose');
const Notification = require('./models/Notification');
const User = require('./models/user');
require('dotenv').config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smart-incident-tracker');
    console.log('Connected to DB');

    const responder = await User.findOne({ email: '2312025@nec.edu.in' });
    console.log('Responder ID:', responder ? responder._id : 'Not found');

    if (responder) {
      const notifs = await Notification.find({ user: responder._id }).sort({ createdAt: -1 });
      console.log('Total notifications:', notifs.length);
      console.log('Notifications:', JSON.stringify(notifs, null, 2));
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};
run();
