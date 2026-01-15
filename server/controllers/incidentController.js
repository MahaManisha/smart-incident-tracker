const Incident = require('../models/Incident');
const User = require('../models/user');
// const Comment = require('../models/Comment'); // REMOVED - Model doesn't exist
// const Escalation = require('../models/Escalation'); // REMOVED - Model doesn't exist
const { calculateSLADeadline } = require('../services/slaService');
const {
  notifyIncidentCreated,
  notifyIncidentAssigned,
  notifyIncidentResolved,
  notifyStatusUpdate,
  notifyEscalation
} = require('../services/notificationService');
const { logAudit } = require('../middleware/auditLogger');

/* ============================
   CREATE INCIDENT
============================ */
const createIncident = async (req, res) => {
  try {
    const { title, description, severity, affectedService, impactedUsers } = req.body;

    // Set reported time
    const reportedAt = new Date();
    
    // Calculate SLA deadline based on severity
    const slaDue = await calculateSLADeadline(severity, reportedAt);

    // Create incident with all required fields
    const incident = await Incident.create({
      title,
      description,
      severity,
      reportedBy: req.user.id, // Works for ADMIN, REPORTER, or any role
      reportedByRole: req.user.role, // ADMIN, REPORTER, or RESPONDER
      reportedAt,
      slaDue,
      status: 'OPEN', // Initial status
      affectedService: affectedService || undefined,
      impactedUsers: impactedUsers || undefined
    });

    // Populate reporter details
    await incident.populate('reportedBy', 'name email role');

    // Log audit trail
    await logAudit('INCIDENT_CREATED', req.user.id, incident._id, {
      severity,
      title
    });

    // Send notifications
    await notifyIncidentCreated(incident);

    res.status(201).json({
      message: 'Incident created successfully',
      incident
    });
  } catch (error) {
    console.error('Incident creation error:', error);
    res.status(500).json({ 
      message: 'Incident creation failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/* ============================
   GET ALL INCIDENTS
============================ */
const getAllIncidents = async (req, res) => {
  try {
    const query = {};

    // Role-based filtering
    if (req.user.role === 'REPORTER') {
      query.reportedBy = req.user.id;
    }

    if (req.user.role === 'RESPONDER') {
      query.assignedTo = req.user.id;
    }

    // ADMIN sees all incidents (no filter)

    const incidents = await Incident.find(query)
      .populate('reportedBy', 'name email role')
      .populate('assignedTo', 'name email role')
      .sort({ createdAt: -1 });

    res.json({ incidents });
  } catch (error) {
    console.error('Fetch incidents error:', error);
    res.status(500).json({ message: 'Failed to fetch incidents' });
  }
};

/* ============================
   GET INCIDENT BY ID
============================ */
const getIncidentById = async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id)
      .populate('reportedBy', 'name email role')
      .populate('assignedTo', 'name email role');

    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    // Authorization checks
    if (
      req.user.role === 'REPORTER' &&
      incident.reportedBy._id.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (
      req.user.role === 'RESPONDER' &&
      incident.assignedTo &&
      incident.assignedTo._id.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // ADMIN has access to all incidents

    res.json({ incident });
  } catch (error) {
    console.error('Fetch incident error:', error);
    res.status(500).json({ message: 'Failed to fetch incident' });
  }
};

/* ============================
   ASSIGN INCIDENT
============================ */
const assignIncident = async (req, res) => {
  try {
    const { responderId } = req.body;

    // Verify responder exists and is active
    const responder = await User.findOne({
      _id: responderId,
      role: 'RESPONDER',
      isActive: true
    });

    if (!responder) {
      return res.status(400).json({ message: 'Invalid responder' });
    }

    // Find incident
    const incident = await Incident.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    // Update incident
    incident.assignedTo = responderId;
    incident.status = 'INVESTIGATING';

    await incident.save();
    await incident.populate('assignedTo', 'name email');

    // Log audit
    await logAudit('INCIDENT_ASSIGNED', req.user.id, incident._id, {
      responderId,
      responderName: responder.name
    });

    // Send notification
    await notifyIncidentAssigned(incident, responder);

    res.json({
      message: 'Incident assigned successfully',
      incident
    });
  } catch (error) {
    console.error('Assignment error:', error);
    res.status(500).json({ message: 'Assignment failed' });
  }
};

/* ============================
   UPDATE STATUS
============================ */
const updateIncidentStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const incident = await Incident.findById(req.params.id)
      .populate('reportedBy', 'name email')
      .populate('assignedTo', 'name email');

    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    // Authorization: Only assigned responder or ADMIN can update status
    if (
      req.user.role === 'RESPONDER' &&
      (!incident.assignedTo ||
        incident.assignedTo._id.toString() !== req.user.id)
    ) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Store old status for audit
    const oldStatus = incident.status;
    incident.status = status;

    // If resolved, set resolution time
    if (status === 'RESOLVED') {
      incident.resolvedAt = new Date();
      await notifyIncidentResolved(incident, incident.reportedBy);
    }

    await incident.save();

    // Log audit
    await logAudit('STATUS_UPDATED', req.user.id, incident._id, {
      from: oldStatus,
      to: status
    });

    // Send status update notification
    await notifyStatusUpdate(incident, oldStatus, status);

    res.json({
      message: 'Status updated',
      incident
    });
  } catch (error) {
    console.error('Status update error:', error);
    res.status(500).json({ message: 'Status update failed' });
  }
};

/* ============================
   ADD COMMENT
   NOTE: This stores comments directly in the Incident model's comments array
============================ */
const addComment = async (req, res) => {
  try {
    const { comment, isInternal } = req.body;

    const incident = await Incident.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    // Create comment object to add to incident's comments array
    const newComment = {
      userId: req.user.id,
      userName: req.user.name, // Assuming req.user has name
      userRole: req.user.role,
      comment,
      isInternal: isInternal || false,
      createdAt: new Date()
    };

    // If your Incident model has a comments array field
    if (!incident.comments) {
      incident.comments = [];
    }
    incident.comments.push(newComment);
    
    await incident.save();

    // Log audit
    await logAudit('COMMENT_ADDED', req.user.id, incident._id, {
      isInternal
    });

    res.status(201).json({
      message: 'Comment added',
      comment: newComment
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Failed to add comment' });
  }
};

module.exports = {
  createIncident,
  getAllIncidents,
  getIncidentById,
  assignIncident,
  updateIncidentStatus,
  addComment
};