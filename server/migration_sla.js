const mongoose = require('mongoose');
const Incident = require('./models/Incident');
const slaService = require('./services/slaService');
require('dotenv').config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smart-incident-tracker');
    
    // Find incidents that have invalid or missing SLA deadlines
    const incidents = await Incident.find({
      $or: [
        { slaResolutionDeadline: null },
        { slaResponseDeadline: null }
      ]
    });
    
    console.log(`Found ${incidents.length} incidents missing SLA deadlines. Recalculating...`);
    
    let updatedCount = 0;
    for (const incident of incidents) {
      await slaService.attachSLA(incident);
      await incident.save();
      updatedCount++;
    }
    
    console.log(`Successfully recalculated SLA timers for ${updatedCount} incidents.`);
    process.exit(0);
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  }
};
run();
