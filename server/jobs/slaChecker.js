const cron = require('node-cron');
const Incident = require('../models/Incident');
const { checkSLAStatus } = require('../services/slaService');
const { notifySLAWarning, notifySLABreach } = require('../services/notificationService');

// SLA monitoring job - runs every 15 minutes
const startSLAChecker = () => {
  console.log('🕐 SLA Checker scheduled to run every 15 minutes');

  // Run every 15 minutes: */15 * * * *
  cron.schedule('*/15 * * * *', async () => {
    console.log('⏰ Running SLA check...');
    
    try {
      // Get all open/in-progress incidents
      const incidents = await Incident.find({
        status: { $in: ['OPEN', 'ASSIGNED', 'INVESTIGATING'] },
        slaDeadline: { $exists: true }
      }).populate('responder', 'name email');

      let warningsCount = 0;
      let breachesCount = 0;

      for (const incident of incidents) {
        const { status: slaStatus } = checkSLAStatus(incident);

        // Check if approaching breach and not already warned
        if (slaStatus === 'APPROACHING_BREACH' && incident.slaStatus !== 'APPROACHING_BREACH') {
          incident.slaStatus = 'APPROACHING_BREACH';
          await incident.save();
          await notifySLAWarning(incident);
          warningsCount++;
          console.log(`⚠️  SLA warning: ${incident.incidentNumber}`);
        }

        // Check if breached and not already marked
        if (slaStatus === 'BREACHED' && incident.slaStatus !== 'BREACHED') {
          incident.slaStatus = 'BREACHED';
          incident.slaBreachedAt = new Date();
          await incident.save();
          await notifySLABreach(incident);
          breachesCount++;
          console.log(`🚨 SLA breach: ${incident.incidentNumber}`);
          
          // TODO: Implement auto-escalation logic here if needed
          // await autoEscalateIncident(incident);
        }
      }

      console.log(`✅ SLA check completed. Warnings: ${warningsCount}, Breaches: ${breachesCount}`);
    } catch (error) {
      console.error('❌ SLA check error:', error.message);
    }
  });
};

// Optional: Daily summary job - runs at 9 AM every day
const startDailySummaryJob = () => {
  console.log('📊 Daily summary scheduled for 9:00 AM');

  // Run at 9 AM every day: 0 9 * * *
  cron.schedule('0 9 * * *', async () => {
    console.log('📧 Generating daily summary...');
    
    try {
      const { calculateDashboardMetrics } = require('../services/analyticsService');
      const { sendDailySummaryEmail } = require('../services/emailService');
      const User = require('../models/user');

      const stats = await calculateDashboardMetrics();
      const admins = await User.find({ role: 'ADMIN', isActive: true });

      for (const admin of admins) {
        await sendDailySummaryEmail(admin.email, admin.name, stats);
      }

      console.log(`✅ Daily summary sent to ${admins.length} admins`);
    } catch (error) {
      console.error('❌ Daily summary error:', error.message);
    }
  });
};

module.exports = {
  startSLAChecker,
  startDailySummaryJob
};