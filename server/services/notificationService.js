const Notification = require('../models/Notification');
const { sendEmail } = require('./emailService');

// Create a notification
const createNotification = async (userId, type, incidentId, title, message, priority = 'MEDIUM') => {
  try {
    const notification = await Notification.create({
      userId,
      type,
      incidentId,
      title,
      message,
      priority
    });
    
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Notify when incident is created
const notifyIncidentCreated = async (incident) => {
  try {
    const User = require('../models/user');
    const admins = await User.find({ role: 'ADMIN', isActive: true });
    
    const notifications = admins.map(admin => 
      createNotification(
        admin._id,
        'INCIDENT_CREATED',
        incident._id,
        'New Incident Reported',
        `Incident ${incident.incidentNumber} has been created with ${incident.severity} severity: ${incident.title}`
      )
    );
    
    await Promise.all(notifications);
    
    console.log(`Notifications sent to ${admins.length} admins for incident ${incident.incidentNumber}`);
  } catch (error) {
    console.error('Error notifying incident created:', error);
  }
};

// Notify when incident is assigned
const notifyIncidentAssigned = async (incident, responder) => {
  try {
    await createNotification(
      responder._id,
      'INCIDENT_ASSIGNED',
      incident._id,
      'Incident Assigned to You',
      `You have been assigned to incident ${incident.incidentNumber}: ${incident.title}. SLA deadline: ${new Date(incident.slaDeadline).toLocaleString()}`
    );
    
    // Send email notification
    await sendEmail(
      responder.email,
      'incidentAssigned',
      { incident, responder }
    );
    
    console.log(`Assignment notification sent to ${responder.name}`);
  } catch (error) {
    console.error('Error notifying incident assigned:', error);
  }
};

// Notify SLA warning (approaching breach)
const notifySLAWarning = async (incident) => {
  try {
    if (!incident.responder) return;
    
    await createNotification(
      incident.responder._id || incident.responder,
      'SLA_WARNING',
      incident._id,
      '⚠️ SLA Warning - Action Needed',
      `Incident ${incident.incidentNumber} is approaching its SLA deadline. Please prioritize this incident.`,
      'HIGH'
    );
    
    const User = require('../models/user');
    const responder = await User.findById(incident.responder);
    
    if (responder) {
      const { formatTimeRemaining } = require('./slaService');
      const now = new Date();
      const deadline = new Date(incident.slaDeadline);
      const timeRemaining = formatTimeRemaining(deadline - now);
      
      await sendEmail(
        responder.email,
        'slaWarning',
        { incident, timeRemaining }
      );
    }
    
    console.log(`SLA warning sent for incident ${incident.incidentNumber}`);
  } catch (error) {
    console.error('Error notifying SLA warning:', error);
  }
};

// Notify SLA breach
const notifySLABreach = async (incident) => {
  try {
    const User = require('../models/user');
    const notifications = [];
    
    // Notify assigned responder
    if (incident.responder) {
      notifications.push(
        createNotification(
          incident.responder._id || incident.responder,
          'SLA_BREACH',
          incident._id,
          '🚨 SLA BREACH ALERT',
          `URGENT: Incident ${incident.incidentNumber} has breached its SLA deadline!`,
          'HIGH'
        )
      );
    }
    
    // Notify all admins
    const admins = await User.find({ role: 'ADMIN', isActive: true });
    admins.forEach(admin => {
      notifications.push(
        createNotification(
          admin._id,
          'SLA_BREACH',
          incident._id,
          '🚨 SLA BREACH ALERT',
          `Incident ${incident.incidentNumber} has breached its SLA deadline. Immediate action required!`,
          'HIGH'
        )
      );
    });
    
    await Promise.all(notifications);
    
    // Send email notifications
    const emailRecipients = [...admins];
    if (incident.responder) {
      const responder = await User.findById(incident.responder);
      if (responder) emailRecipients.push(responder);
    }
    
    for (const user of emailRecipients) {
      await sendEmail(user.email, 'slaBreachAlert', { incident });
    }
    
    console.log(`SLA breach notifications sent for incident ${incident.incidentNumber}`);
  } catch (error) {
    console.error('Error notifying SLA breach:', error);
  }
};

// Notify when incident is resolved
const notifyIncidentResolved = async (incident, reporter) => {
  try {
    await createNotification(
      reporter._id,
      'INCIDENT_RESOLVED',
      incident._id,
      '✅ Your Incident Has Been Resolved',
      `Incident ${incident.incidentNumber} has been resolved. ${incident.resolutionNotes || ''}`
    );
    
    await sendEmail(
      reporter.email,
      'incidentResolved',
      { incident, reporter }
    );
    
    console.log(`Resolution notification sent to ${reporter.name}`);
  } catch (error) {
    console.error('Error notifying incident resolved:', error);
  }
};

// Notify status update
const notifyStatusUpdate = async (incident, oldStatus, newStatus) => {
  try {
    const User = require('../models/user');
    const reporter = await User.findById(incident.reporter);
    
    if (!reporter) return;
    
    await createNotification(
      reporter._id,
      'INCIDENT_UPDATED',
      incident._id,
      'Incident Status Updated',
      `Incident ${incident.incidentNumber} status changed from ${oldStatus} to ${newStatus}`
    );
    
    console.log(`Status update notification sent for incident ${incident.incidentNumber}`);
  } catch (error) {
    console.error('Error notifying status update:', error);
  }
};

// Notify escalation
const notifyEscalation = async (incident, escalatedTo, reason) => {
  try {
    await createNotification(
      escalatedTo._id,
      'INCIDENT_ASSIGNED',
      incident._id,
      'Incident Escalated to You',
      `Incident ${incident.incidentNumber} has been escalated to you. Reason: ${reason}`,
      'HIGH'
    );
    
    console.log(`Escalation notification sent for incident ${incident.incidentNumber}`);
  } catch (error) {
    console.error('Error notifying escalation:', error);
  }
};

module.exports = {
  createNotification,
  notifyIncidentCreated,
  notifyIncidentAssigned,
  notifySLAWarning,
  notifySLABreach,
  notifyIncidentResolved,
  notifyStatusUpdate,
  notifyEscalation
};