const Incident = require('../models/Incident');
const User = require('../models/user');
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
   ✅ FIXED: Now always sets reportedBy from req.user.id
============================ */
const createIncident = async (req, res) => {
  try {
    const { title, description, severity, affectedService, impactedUsers } = req.body;

    // Set reported time
    const reportedAt = new Date();
    
    // Calculate SLA deadline based on severity
    const slaDue = await calculateSLADeadline(severity, reportedAt);

    // ✅ FIX: Always populate reportedBy from authenticated user
    const incident = await Incident.create({
      title,
      description,
      severity,
      reportedBy: req.user.id,           // ✅ ALWAYS SET FROM AUTHENTICATED USER
      reportedByRole: req.user.role,     // ✅ ALWAYS SET FROM AUTHENTICATED USER
      reportedAt,
      slaDue,
      status: 'OPEN',                    // ✅ DEFAULT STATUS
      affectedService: affectedService || undefined,
      impactedUsers: impactedUsers || undefined
      // ✅ NO assignedTo - will be set in assignment workflow
    });

    // ✅ Populate reporter details before sending response
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
   ✅ FIXED: Now populates reportedBy correctly
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

    // ✅ FIX: Populate both reportedBy and assignedTo
    const incidents = await Incident.find(query)
      .populate('reportedBy', 'name email role')    // ✅ POPULATE REPORTER
      .populate('assignedTo', 'name email role')    // ✅ POPULATE RESPONDER
      .sort({ createdAt: -1 });

    res.json({ incidents });
  } catch (error) {
    console.error('Fetch incidents error:', error);
    res.status(500).json({ message: 'Failed to fetch incidents' });
  }
};

/* ============================
   GET UNASSIGNED INCIDENTS (NEW)
   ✅ NEW: For admin assignment workflow
============================ */
const getUnassignedIncidents = async (req, res) => {
  try {
    const incidents = await Incident.find({
      status: 'OPEN',
      assignedTo: null
    })
      .populate('reportedBy', 'name email role')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: incidents.length,
      incidents
    });
  } catch (error) {
    console.error('Fetch unassigned incidents error:', error);
    res.status(500).json({ message: 'Failed to fetch unassigned incidents' });
  }
};

/* ============================
   GET INCIDENT BY ID
   ✅ FIXED: Now populates reportedBy correctly
============================ */
const getIncidentById = async (req, res) => {
  try {
    // ✅ FIX: Populate both reportedBy and assignedTo
    const incident = await Incident.findById(req.params.id)
      .populate('reportedBy', 'name email role')
      .populate('assignedTo', 'name email role')
      .populate('comments.userId', 'name email role');

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
   ✅ UPDATED: Separated from creation workflow
============================ */
const assignIncident = async (req, res) => {
  try {
    const { responderId } = req.body;

    // Validation
    if (!responderId) {
      return res.status(400).json({ message: 'Responder ID is required' });
    }

    // Verify responder exists and is active
    const responder = await User.findOne({
      _id: responderId,
      role: 'RESPONDER',
      isActive: true
    });

    if (!responder) {
      return res.status(400).json({ message: 'Invalid responder or responder not found' });
    }

    // Find incident
    const incident = await Incident.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    // Check if already assigned
    if (incident.assignedTo) {
      return res.status(400).json({ 
        message: 'Incident is already assigned',
        currentResponder: incident.assignedTo
      });
    }

    // ✅ Update incident - assign responder and change status
    incident.assignedTo = responderId;
    incident.status = 'INVESTIGATING';

    await incident.save();
    
    // Populate both fields
    await incident.populate('assignedTo', 'name email role');
    await incident.populate('reportedBy', 'name email role');

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
      .populate('reportedBy', 'name email role')
      .populate('assignedTo', 'name email role');

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
   GET COMMENTS FOR INCIDENT
============================ */
const getComments = async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id)
      .populate('comments.userId', 'name email role');
    
    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    const comments = incident.comments || [];

    res.json({ 
      comments,
      count: comments.length 
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ message: 'Failed to load comments' });
  }
};

/* ============================
   ADD COMMENT
============================ */
const addComment = async (req, res) => {
  try {
    const { comment, isInternal } = req.body;

    const incident = await Incident.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    const newComment = {
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      comment,
      isInternal: isInternal || false,
      createdAt: new Date()
    };

    incident.comments.push(newComment);
    
    await incident.save();
    await incident.populate('comments.userId', 'name email role');

    const addedComment = incident.comments[incident.comments.length - 1];

    await logAudit('COMMENT_ADDED', req.user.id, incident._id, {
      isInternal
    });

    res.status(201).json({
      message: 'Comment added',
      comment: addedComment
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Failed to add comment' });
  }
};

module.exports = {
  createIncident,
  getAllIncidents,
  getUnassignedIncidents,    // ✅ NEW EXPORT
  getIncidentById,
  assignIncident,
  updateIncidentStatus,
  getComments,
  addComment
};