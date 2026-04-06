const Notification = require('../models/Notification');
const { sendEmail } = require('./emailService');

// Create a notification
const createNotification = async (userId, type, incidentId, title, message, priority = 'MEDIUM') => {
  try {
    const notification = await Notification.create({
      user: userId,
      type,
      incident: incidentId,
      title,
      message,
      priority
    });

    try {
      const io = require('../socket').getIO();
      if (io) {
        io.to(userId.toString()).emit('notification', notification);
      }
    } catch (socketError) {
      console.error('Socket emit error (can be ignored if during setup):', socketError.message);
    }

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Broadcast to all clients specifically for live-map updates
const broadcastGraphUpdate = () => {
  try {
    const socketUtil = require('../socket');
    const io = socketUtil.getIO();
    if (io) {
      io.emit('GRAPH_UPDATED', { timestamp: new Date() });
    }
  } catch (err) {
    // Silently ignore if socket not ready
  }
};

// Notify when incident is created
const notifyIncidentCreated = async (incident) => {
  try {
    const User = require('../models/User');
    const admins = await User.find({ role: 'ADMIN', isActive: true });

    const notifications = admins.map(async (admin) => {
      await createNotification(
        admin._id,
        'INCIDENT_CREATED',
        incident._id,
        'New Incident Reported',
        `Incident ${incident.incidentNumber} has been created with ${incident.severity} severity: ${incident.title}`
      );

      if (admin.email) {
        await sendEmail(admin.email, 'incidentCreated', { incident, admin });
      }
    });

    await Promise.all(notifications);
    broadcastGraphUpdate();
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

    await sendEmail(
      responder.email,
      'incidentAssigned',
      { incident, responder }
    );
  } catch (error) {
    console.error('Error notifying incident assigned:', error);
  }
};

// Notify when incident is AUTO assigned (Notifies Admin too)
const notifyIncidentAutoAssigned = async (incident, responderId) => {
  try {
    const User = require('../models/User');
    const responder = await User.findById(responderId);
    if (!responder) return;

    // Send the usual notification to responder
    await notifyIncidentAssigned(incident, responder);

    // Also notify all admins
    const admins = await User.find({ role: 'ADMIN', isActive: true });
    const notifications = admins.map(admin =>
      createNotification(
        admin._id,
        'INCIDENT_ASSIGNED',
        incident._id,
        'Incident Auto-Assigned',
        `Incident ${incident.incidentNumber || 'NEW'} has been automatically assigned to ${responder.name} via On-Call schedule.`
      )
    );
    await Promise.all(notifications);
  } catch (error) {
    console.error('Error notifying incident auto-assigned:', error);
  }
};

// Notify when incident is resolved
const notifyIncidentResolved = async (incident, reporter) => {
  try {
    await createNotification(
      reporter._id, // Reporter might be an object or ID, ensure passing ID
      'INCIDENT_RESOLVED',
      incident._id,
      'Incident Resolved',
      `Incident ${incident.incidentNumber} has been resolved. ${incident.resolutionNotes || ''}`
    );

    await sendEmail(
      reporter.email,
      'incidentResolved',
      { incident, reporter }
    );
    broadcastGraphUpdate();
  } catch (error) {
    console.error('Error notifying incident resolved:', error);
  }
};

// Notify status update
const notifyStatusUpdate = async (incident, oldStatus, newStatus) => {
  try {
    const User = require('../models/User');
    const notifications = [];

    // Notify Reporter
    const reporterRef = incident.reportedBy || incident.reporter;
    const reporterId = reporterRef ? (reporterRef._id || reporterRef) : null;

    if (reporterId) {
      notifications.push(createNotification(
        reporterId,
        'INCIDENT_UPDATED',
        incident._id,
        'Incident Status Updated',
        `Incident ${incident.incidentNumber} status changed from ${oldStatus} to ${newStatus}`
      ));
    }

    // Notify Admins
    const admins = await User.find({ role: 'ADMIN', isActive: true });
    admins.forEach(admin => {
      // Avoid duplicates if admin is reporter
      if (reporterId && admin._id.toString() === reporterId.toString()) return;

      notifications.push(createNotification(
        admin._id,
        'INCIDENT_UPDATED',
        incident._id,
        'Incident Status Updated',
        `Incident ${incident.incidentNumber} status changed from ${oldStatus} to ${newStatus}`
      ));
    });

    await Promise.all(notifications);
    broadcastGraphUpdate();
  } catch (error) {
    console.error('Error notifying status update:', error);
  }
};

// Notify SLA Warning
const notifySLAWarning = async (incident) => {
  // Implementation for SLA Warning
  try {
    if (!incident.responder) return;
    await createNotification(
      incident.responder,
      'SLA_WARNING',
      incident._id,
      'SLA Warning',
      `Incident ${incident.incidentNumber} is approaching SLA deadline.`,
      'HIGH'
    );
    // Email logic could go here
  } catch (e) { console.error(e) }
};

// Notify SLA Breach
const notifySLABreach = async (incident) => {
  try {
    const User = require('../models/User');
    const admins = await User.find({ role: 'ADMIN', isActive: true });

    // Notify Responder
    if (incident.responder) {
      await createNotification(
        incident.responder,
        'SLA_BREACH',
        incident._id,
        'SLA BREACHED',
        `Incident ${incident.incidentNumber} has breached SLA.`,
        'HIGH'
      );
    }

    // Notify Admins
    for (const admin of admins) {
      await createNotification(
        admin._id,
        'SLA_BREACH',
        incident._id,
        'SLA BREACHED',
        `Incident ${incident.incidentNumber} has breached SLA.`,
        'HIGH'
      );
    }
  } catch (e) { console.error(e) }
};

// Notify Escalation
const notifyEscalation = async (incident, escalatedTo, reason) => {
  try {
    await createNotification(
      escalatedTo._id,
      'INCIDENT_ASSIGNED', // Re-using assigned or maybe INCIDENT_ESCALATED
      incident._id,
      'Incident Escalated to You',
      `Incident ${incident.incidentNumber} escalated. Reason: ${reason}`,
      'HIGH'
    );
  } catch (e) { console.error(e) }
};

// Notify Incident Deleted
const notifyIncidentDeleted = async (incident, deleterId) => {
  try {
    const User = require('../models/User');
    const admins = await User.find({ role: 'ADMIN', isActive: true });

    const notifications = [];

    // Notify Responder if one was assigned
    if (incident.assignedTo && incident.assignedTo.toString() !== deleterId.toString()) {
      notifications.push(
        createNotification(
          incident.assignedTo,
          'INCIDENT_DELETED',
          incident._id,
          'Incident Deleted',
          `Incident ${incident.incidentNumber} (${incident.title}) has been deleted by the reporter.`,
          'HIGH'
        )
      );
    }

    // Notify all Admins (except deleter if admin is the deleter)
    admins.forEach(admin => {
      if (admin._id.toString() !== deleterId.toString()) {
        notifications.push(
          createNotification(
            admin._id,
            'INCIDENT_DELETED',
            incident._id,
            'Incident Deleted',
            `Incident ${incident.incidentNumber} (${incident.title}) has been deleted by the reporter.`,
            'HIGH'
          )
        );
      }
    });

    await Promise.all(notifications);
  } catch (error) {
    console.error('Error notifying incident deleted:', error);
  }
};

module.exports = {
  createNotification,
  notifyIncidentCreated,
  notifyIncidentAssigned,
  notifyIncidentResolved,
  notifyStatusUpdate,
  notifySLAWarning,
  notifySLABreach,
  notifyEscalation,
  notifyIncidentAutoAssigned,
  notifyIncidentDeleted
};