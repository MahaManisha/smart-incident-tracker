const Postmortem = require('../models/Postmortem');
const Incident = require('../models/Incident');
const { logAudit } = require('../middleware/auditLogger');

// Create postmortem
const createPostmortem = async (req, res) => {
  try {
    const { incidentId, rootCause, preventiveActions, timeline, impactAnalysis } = req.body;
    
    // Check if incident exists
    const incident = await Incident.findById(incidentId);
    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }
    
    // Only allow postmortem for resolved or closed incidents
    if (!['RESOLVED', 'CLOSED'].includes(incident.status)) {
      return res.status(400).json({ 
        message: 'Postmortem can only be created for resolved or closed incidents' 
      });
    }
    
    // Check authorization - only assigned responder or admin
    if (req.user.role === 'RESPONDER' && 
        (!incident.responder || incident.responder.toString() !== req.user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Check if postmortem already exists
    const existingPostmortem = await Postmortem.findOne({ incidentId });
    if (existingPostmortem) {
      return res.status(400).json({ 
        message: 'Postmortem already exists for this incident. Use update endpoint.' 
      });
    }
    
    const postmortem = await Postmortem.create({
      incidentId,
      submittedBy: req.user.id,
      rootCause,
      preventiveActions,
      timeline: timeline || [],
      impactAnalysis: impactAnalysis || ''
    });
    
    await postmortem.populate('incidentId', 'incidentNumber title severity');
    await postmortem.populate('submittedBy', 'name email');
    
    // Log audit
    await logAudit('Created Postmortem', req.user.id, postmortem._id, { incidentId });
    
    res.status(201).json({
      message: 'Postmortem created successfully',
      postmortem
    });
  } catch (error) {
    console.error('Error creating postmortem:', error);
    res.status(500).json({ 
      message: 'Error creating postmortem', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

// Get postmortem by incident ID
const getPostmortemByIncident = async (req, res) => {
  try {
    const { incidentId } = req.params;
    
    const postmortem = await Postmortem.findOne({ incidentId })
      .populate('incidentId', 'incidentNumber title severity status')
      .populate('submittedBy', 'name email role')
      .populate('reviewedBy', 'name email');
    
    if (!postmortem) {
      return res.status(404).json({ message: 'Postmortem not found for this incident' });
    }
    
    res.json({ postmortem });
  } catch (error) {
    console.error('Error fetching postmortem:', error);
    res.status(500).json({ 
      message: 'Error fetching postmortem', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

// Get postmortem by ID
const getPostmortemById = async (req, res) => {
  try {
    const postmortem = await Postmortem.findById(req.params.id)
      .populate('incidentId', 'incidentNumber title severity status reportedAt resolvedAt')
      .populate('submittedBy', 'name email role')
      .populate('reviewedBy', 'name email');
    
    if (!postmortem) {
      return res.status(404).json({ message: 'Postmortem not found' });
    }
    
    res.json({ postmortem });
  } catch (error) {
    console.error('Error fetching postmortem:', error);
    res.status(500).json({ 
      message: 'Error fetching postmortem', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

// Get all postmortems
const getAllPostmortems = async (req, res) => {
  try {
    const { reviewed, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (reviewed !== undefined) {
      query.reviewed = reviewed === 'true';
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const postmortems = await Postmortem.find(query)
      .populate('incidentId', 'incidentNumber title severity status')
      .populate('submittedBy', 'name email')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Postmortem.countDocuments(query);
    
    res.json({
      postmortems,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching postmortems:', error);
    res.status(500).json({ 
      message: 'Error fetching postmortems', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

// Update postmortem
const updatePostmortem = async (req, res) => {
  try {
    const { rootCause, preventiveActions, timeline, impactAnalysis } = req.body;
    
    const postmortem = await Postmortem.findById(req.params.id);
    
    if (!postmortem) {
      return res.status(404).json({ message: 'Postmortem not found' });
    }
    
    // Authorization check - only submitter or admin can update
    if (req.user.role !== 'ADMIN' && postmortem.submittedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Don't allow updates to reviewed postmortems unless admin
    if (postmortem.reviewed && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Cannot update reviewed postmortem' });
    }
    
    if (rootCause) postmortem.rootCause = rootCause;
    if (preventiveActions) postmortem.preventiveActions = preventiveActions;
    if (timeline) postmortem.timeline = timeline;
    if (impactAnalysis !== undefined) postmortem.impactAnalysis = impactAnalysis;
    
    await postmortem.save();
    await postmortem.populate('incidentId', 'incidentNumber title severity');
    await postmortem.populate('submittedBy', 'name email');
    
    // Log audit
    await logAudit('Updated Postmortem', req.user.id, postmortem._id);
    
    res.json({
      message: 'Postmortem updated successfully',
      postmortem
    });
  } catch (error) {
    console.error('Error updating postmortem:', error);
    res.status(500).json({ 
      message: 'Error updating postmortem', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

// Mark postmortem as reviewed
const markPostmortemReviewed = async (req, res) => {
  try {
    const postmortem = await Postmortem.findById(req.params.id);
    
    if (!postmortem) {
      return res.status(404).json({ message: 'Postmortem not found' });
    }
    
    if (postmortem.reviewed) {
      return res.status(400).json({ message: 'Postmortem already reviewed' });
    }
    
    postmortem.reviewed = true;
    postmortem.reviewedBy = req.user.id;
    postmortem.reviewedAt = new Date();
    
    await postmortem.save();
    await postmortem.populate('reviewedBy', 'name email');
    await postmortem.populate('incidentId', 'incidentNumber title');
    
    // Log audit
    await logAudit('Reviewed Postmortem', req.user.id, postmortem._id);
    
    res.json({
      message: 'Postmortem marked as reviewed',
      postmortem
    });
  } catch (error) {
    console.error('Error reviewing postmortem:', error);
    res.status(500).json({ 
      message: 'Error reviewing postmortem', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

// Delete postmortem
const deletePostmortem = async (req, res) => {
  try {
    const postmortem = await Postmortem.findById(req.params.id);
    
    if (!postmortem) {
      return res.status(404).json({ message: 'Postmortem not found' });
    }
    
    // Only admin can delete reviewed postmortems
    if (postmortem.reviewed && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Cannot delete reviewed postmortem' });
    }
    
    await postmortem.deleteOne();
    
    // Log audit
    await logAudit('Deleted Postmortem', req.user.id, postmortem._id);
    
    res.json({
      message: 'Postmortem deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting postmortem:', error);
    res.status(500).json({ 
      message: 'Error deleting postmortem', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

module.exports = {
  createPostmortem,
  getPostmortemByIncident,
  getPostmortemById,
  getAllPostmortems,
  updatePostmortem,
  markPostmortemReviewed,
  deletePostmortem
};