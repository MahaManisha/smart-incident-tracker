const mongoose = require('mongoose');
const Notification = require('./models/Notification');
require('dotenv').config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smart-incident-tracker');
    
    // Delete test notifications by checking their title/message for 'Test' or specific incident numbers
    const result = await Notification.deleteMany({
      $or: [
        { message: { $regex: /INC-9999/ } },
        { message: { $regex: /INC-1234/ } }
      ]
    });
    
    console.log(`Deleted ${result.deletedCount} test notifications.`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};
run();
