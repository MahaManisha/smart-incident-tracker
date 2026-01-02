const Incident = require('../models/Incident');
const User = require('../models/user');
const Comment = require('../models/Comment');
const Escalation = require('../models/Escalation');
const { calculateSLADeadline, checkSLAStatus } = require('../services/slaService');
const { 
  notifyIncidentCreated, 
  notifyIncidentAssigned,
  notifyIncidentResolved,
  notifyStatusUpdate,
  notifyEscalation
} = require('../services/notificationService');
const { logAudit } = require('../middleware/auditLogger');

// Generate incident number (INC-YYYY-NNNN)
const generateIncidentNumber = async () => {
  const year = new Date().getFullYear();
  const prefix = `INC-${year}-`;
  
  const lastIncident = await Incident.findOne({
    incidentNumber: new RegExp(`^${prefix}`)
  }).sort({ incidentNumber: -1 });
  
  let nextNumber = 1;
  if (lastIncident) {
    const lastNumber = parseInt(lastIncident.incidentNumber.split('-')[2]);
    nextNumber = lastNumber + 1;
  }
  
  return `${prefix}${String(nextNumber).padStart(4, '0')}`;
};

// Create incident
const createIncident = async (req, res) => {
  try {
    const { title, description, severity, affectedService, impactedUsers } = req.body;
    
    // Generate incident number
    const incidentNumber = await generateIncidentNumber();
    
    // Calculate SLA deadline
    const reportedAt = new Date();
    const slaDeadline = await calculateSLADeadline(severity, reportedAt);
    
    // Create incident
    const incident = await Incident.create({
      incidentNumber,
      title,
      description,
      severity,
      affectedService,
      impactedUsers,
      reporter: req.user.id,
      reportedAt,
      slaDeadline,
      status: 'OPEN',
      slaStatus: 'WITHIN_SLA'
    });
    
    // Populate reporter details
    await incident.populate('reporter', 'name email');
    
    // Log audit trail
    await logAudit('Created Incident', req.user.id, incident._id, {
      incidentNumber: incident.incidentNumber,
      severity
    });
    
    // Send notifications to admins
    await notifyIncidentCreated(incident);
    
    res.status(201).json({
      message: 'Incident created successfully',
      incident
    });
  } catch (error) {
    console.error('Error creating incident:', error);
    res.status(500).json({ 
      message: 'Error creating incident', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

// Get all incidents with filters and pagination
const getAllIncidents = async (req, res) => {
  try {
    const { 
      status, 
      severity, 
      slaStatus,
      page = 1, 
      limit = 20,
      sortBy = 'reportedAt',
      order = 'desc'
    } = req.query;
    
    const query = {};
    
    // Apply filters
    if (status) query.status = status;
    if (severity) query.severity = severity;
    if (slaStatus) query.slaStatus = slaStatus;
    
    // Role-based filtering
    if (req.user.role === 'RESPONDER') {
      query.responder = req.user.id;
    } else if (req.user.role === 'REPORTER') {
      query.reporter = req.user.id;
    }
    // ADMIN sees all incidents
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = order === 'desc' ? -1 : 1;
    
    const incidents = await Incident.find(query)
      .populate('reporter', 'name email')
      .populate('responder', 'name email')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Incident.countDocuments(query);
    
    res.json({
      incidents,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching incidents:', error);
    res.status(500).json({ 
      message: 'Error fetching incidents', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

// Get incident by ID
const getIncidentById = async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id)
      .populate('reporter', 'name email role')
      .populate('responder', 'name email role')
      .populate('assignedBy', 'name email');
    
    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }
    
    // Authorization check
    if (req.user.role === 'REPORTER' && incident.reporter._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    if (req.user.role === 'RESPONDER' && (!incident.responder || incident.responder._id.toString() !== req.user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Get comments
    const comments = await Comment.find({ incidentId: incident._id })
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 });
    
    // Get escalation history
    const escalations = await Escalation.find({ incidentId: incident._id })
      .populate('escalatedBy', 'name email')
      .populate('escalatedTo', 'name email')
      .populate('previousAssignee', 'name email')
      .sort({ createdAt: -1 });
    
    // Check current SLA status
    if (['OPEN', 'ASSIGNED', 'INVESTIGATING'].includes(incident.status)) {
      const slaInfo = checkSLAStatus(incident);
      incident.currentSLAStatus = slaInfo;
    }
    
    res.json({
      incident,
      comments,
      escalations
    });
  } catch (error) {
    console.error('Error fetching incident:', error);
    res.status(500).json({ 
      message: 'Error fetching incident', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

// Assign incident to responder
const assignIncident = async (req, res) => {
  try {
    const { responderId } = req.body;
    
    const incident = await Incident.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }
    
    // Check if responder exists and is active
    const responder = await User.findOne({ 
      _id: responderId, 
      role: 'RESPONDER', 
      isActive: true 
    });
    
    if (!responder) {
      return res.status(400).json({ message: 'Invalid responder or responder is inactive' });
    }
    
    // Update incident
    incident.responder = responderId;
    incident.status = 'ASSIGNED';
    incident.assignedAt = new Date();
    incident.assignedBy = req.user.id;
    
    // Add to history
    incident.statusHistory.push({
      status: 'ASSIGNED',
      changedBy: req.user.id,
      notes: `Assigned to ${responder.name}`
    });
    
    await incident.save();
    await incident.populate('responder', 'name email');
    
    // Log audit
    await logAudit('Assigned Incident', req.user.id, incident._id, {
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
    console.error('Error assigning incident:', error);
    res.status(500).json({ 
      message: 'Error assigning incident', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

// Update incident status
const updateIncidentStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    
    const incident = await Incident.findById(req.params.id)
      .populate('reporter', 'name email')
      .populate('responder', 'name email');
    
    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }
    
    // Authorization check
    if (req.user.role === 'RESPONDER' && (!incident.responder || incident.responder._id.toString() !== req.user.id)) {
      return res.status(403).json({ message: 'You can only update incidents assigned to you' });
    }
    
    // Validate status transition
    const validTransitions = {
      'OPEN': ['ASSIGNED', 'INVESTIGATING'],
      'ASSIGNED': ['INVESTIGATING', 'OPEN'],
      'INVESTIGATING': ['RESOLVED', 'ASSIGNED'],
      'RESOLVED': ['CLOSED', 'REOPENED'],
      'CLOSED': ['REOPENED'],
      'REOPENED': ['INVESTIGATING', 'ASSIGNED']
    };
    
    if (!validTransitions[incident.status]?.includes(status)) {
      return res.status(400).json({ 
        message: `Invalid status transition from ${incident.status} to ${status}` 
      });
    }
    
    const oldStatus = incident.status;
    incident.status = status;
    
    // Set timestamps based on status
    if (status === 'INVESTIGATING' && !incident.acknowledgedAt) {
      incident.acknowledgedAt = new Date();
    }
    
    if (status === 'RESOLVED') {
      incident.resolvedAt = new Date();
      
      // Calculate actual resolution time
      const reportedAt = new Date(incident.reportedAt);
      const resolvedAt = incident.resolvedAt;
      const diffInMinutes = Math.floor((resolvedAt - reportedAt) / (1000 * 60));
      incident.actualResolutionTime = diffInMinutes;
      
      // Check if SLA was met
      if (incident.resolvedAt <= incident.slaDeadline) {
        incident.slaStatus = 'MET';
      }
    }
    
    // Add to history
    incident.statusHistory.push({
      status,
      changedBy: req.user.id,
      notes: notes || `Status changed to ${status}`
    });
    
    await incident.save();
    
    // Log audit
    await logAudit('Updated Incident Status', req.user.id, incident._id, {
      oldStatus,
      newStatus: status
    });
    
    // Send notifications
    await notifyStatusUpdate(incident, oldStatus, status);
    
    if (status === 'RESOLVED' && incident.reporter) {
      await notifyIncidentResolved(incident, incident.reporter);
    }
    
    res.json({
      message: 'Incident status updated successfully',
      incident
    });
  } catch (error) {
    console.error('Error updating incident status:', error);
    res.status(500).json({ 
      message: 'Error updating incident status', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

// Add comment to incident
const addComment = async (req, res) => {
  try {
    const { comment, isInternal } = req.body;
    
    const incident = await Incident.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }
    
    // Authorization check - user must be involved in the incident
    const isReporter = incident.reporter.toString() === req.user.id;
    const isResponder = incident.responder && incident.responder.toString() === req.user.id;
    const isAdmin = req.user.role === 'ADMIN';
    
    if (!isReporter && !isResponder && !isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Create comment
    const newComment = await Comment.create({
      incidentId: incident._id,
      userId: req.user.id,
      comment,
      isInternal: isInternal || false
    });
    
    await newComment.populate('userId', 'name email role');
    
    // Log audit
    await logAudit('Added Comment', req.user.id, incident._id, {
      commentId: newComment._id,
      isInternal
    });
    
    res.status(201).json({
      message: 'Comment added successfully',
      comment: newComment
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ 
      message: 'Error adding comment', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

// Close incident
const closeIncident = async (req, res) => {
  try {
    const { resolutionNotes, rootCause } = req.body;
    
    const incident = await Incident.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }
    
    // Can only close resolved incidents
    if (incident.status !== 'RESOLVED') {
      return res.status(400).json({ message: 'Only resolved incidents can be closed' });
    }
    
    // Authorization check
    if (req.user.role === 'RESPONDER' && (!incident.responder || incident.responder._id.toString() !== req.user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    incident.status = 'CLOSED';
    incident.closedAt = new Date();
    incident.resolutionNotes = resolutionNotes;
    incident.rootCause = rootCause;
    
    // Add to history
    incident.statusHistory.push({
      status: 'CLOSED',
      changedBy: req.user.id,
      notes: 'Incident closed'
    });
    
    await incident.save();
    
    // Log audit
    await logAudit('Closed Incident', req.user.id, incident._id);
    
    res.json({
      message: 'Incident closed successfully',
      incident
    });
  } catch (error) {
    console.error('Error closing incident:', error);
    res.status(500).json({ 
      message: 'Error closing incident', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

// Reopen incident
const reopenIncident = async (req, res) => {
  try {
    const { reason } = req.body;
    
    const incident = await Incident.findById(req.params.id)
      .populate('reporter', 'name email')
      .populate('responder', 'name email');
    
    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }
    
    // Can only reopen resolved or closed incidents
    if (!['RESOLVED', 'CLOSED'].includes(incident.status)) {
      return res.status(400).json({ message: 'Only resolved or closed incidents can be reopened' });
    }
    
    // Authorization check - reporter or admin
    if (req.user.role === 'REPORTER' && incident.reporter._id.toString() !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    incident.status = 'REOPENED';
    
    // Reset SLA clock
    const newSLADeadline = await calculateSLADeadline(incident.severity, new Date());
    incident.slaDeadline = newSLADeadline;
    incident.slaStatus = 'WITHIN_SLA';
    
    // Clear resolution timestamps
    incident.resolvedAt = null;
    incident.closedAt = null;
    
    // Add to history
    incident.statusHistory.push({
      status: 'REOPENED',
      changedBy: req.user.id,
      notes: `Reopened: ${reason}`
    });
    
    await incident.save();
    
    // Log audit
    await logAudit('Reopened Incident', req.user.id, incident._id, { reason });
    
    // Notify responder if assigned
    if (incident.responder) {
      await notifyStatusUpdate(incident, 'CLOSED', 'REOPENED');
    }
    
    res.json({
      message: 'Incident reopened successfully',
      incident
    });
  } catch (error) {
    console.error('Error reopening incident:', error);
    res.status(500).json({ 
      message: 'Error reopening incident', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

// Get incident history
const getIncidentHistory = async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id)
      .populate({
        path: 'statusHistory.changedBy',
        select: 'name email role'
      });
    
    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }
    
    // Authorization check
    if (req.user.role === 'REPORTER' && incident.reporter.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json({
      incidentNumber: incident.incidentNumber,
      history: incident.statusHistory
    });
  } catch (error) {
    console.error('Error fetching incident history:', error);
    res.status(500).json({ 
      message: 'Error fetching incident history', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

// Escalate incident
const escalateIncident = async (req, res) => {
  try {
    const { escalatedTo, reason } = req.body;
    
    const incident = await Incident.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }
    
    // Authorization check
    if (req.user.role === 'RESPONDER' && (!incident.responder || incident.responder.toString() !== req.user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Check if escalatedTo user exists and is a responder
    const newResponder = await User.findOne({ 
      _id: escalatedTo, 
      role: 'RESPONDER', 
      isActive: true 
    });
    
    if (!newResponder) {
      return res.status(400).json({ message: 'Invalid responder or responder is inactive' });
    }
    
    // Create escalation record
    const escalation = await Escalation.create({
      incidentId: incident._id,
      escalatedBy: req.user.id,
      escalatedTo,
      reason,
      previousAssignee: incident.responder,
      isAutoEscalated: false
    });
    
    // Update incident
    const previousResponder = incident.responder;
    incident.responder = escalatedTo;
    incident.status = 'ASSIGNED';
    
    // Add to history
    incident.statusHistory.push({
      status: 'ESCALATED',
      changedBy: req.user.id,
      notes: `Escalated to ${newResponder.name}: ${reason}`
    });
    
    await incident.save();
    await incident.populate('responder', 'name email');
    
    // Log audit
    await logAudit('Escalated Incident', req.user.id, incident._id, {
      escalatedTo,
      reason
    });
    
    // Send notifications
    await notifyEscalation(incident, newResponder, reason);
    
    res.json({
      message: 'Incident escalated successfully',
      incident,
      escalation
    });
  } catch (error) {
    console.error('Error escalating incident:', error);
    res.status(500).json({ 
      message: 'Error escalating incident', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

// Update incident details
const updateIncident = async (req, res) => {
  try {
    const { title, description, severity, affectedService, impactedUsers } = req.body;
    
    const incident = await Incident.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }
    
    // Authorization check - only reporter or admin can update details
    if (req.user.role === 'REPORTER' && incident.reporter.toString() !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Update fields
    if (title) incident.title = title;
    if (description) incident.description = description;
    if (affectedService) incident.affectedService = affectedService;
    if (impactedUsers !== undefined) incident.impactedUsers = impactedUsers;
    
    // If severity changes, recalculate SLA
    if (severity && severity !== incident.severity) {
      const oldSeverity = incident.severity;
      incident.severity = severity;
      
      // Recalculate SLA deadline if incident is still open
      if (['OPEN', 'ASSIGNED', 'INVESTIGATING'].includes(incident.status)) {
        incident.slaDeadline = await calculateSLADeadline(severity, incident.reportedAt);
      }
      
      // Add to history
      incident.statusHistory.push({
        status: incident.status,
        changedBy: req.user.id,
        notes: `Severity changed from ${oldSeverity} to ${severity}`
      });
    }
    
    await incident.save();
    
    // Log audit
    await logAudit('Updated Incident', req.user.id, incident._id);
    
    res.json({
      message: 'Incident updated successfully',
      incident
    });
  } catch (error) {
    console.error('Error updating incident:', error);
    res.status(500).json({ 
      message: 'Error updating incident', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

module.exports = {
  createIncident,
  getAllIncidents,
  getIncidentById,
  assignIncident,
  updateIncidentStatus,
  addComment,
  closeIncident,
  reopenIncident,
  getIncidentHistory,
  escalateIncident,
  updateIncident
};