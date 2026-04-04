const Incident = require('../models/Incident');
const User = require('../models/user');
const OnCallSchedule = require('../models/OnCallSchedule');
const slaService = require('../services/slaService');
const SLA = require('../models/SLA');
const { logAudit } = require('../middleware/auditLogger');
const { calculatePriority } = require('../utils/priorityCalculator');
const {
  notifyIncidentCreated,
  notifyIncidentAssigned,
  notifyIncidentResolved,
  notifyStatusUpdate,
  notifyEscalation,
  notifyCommentAdded, // ✅ Added
  notifyIncidentAutoAssigned,
  notifyIncidentDeleted
} = require('../services/notificationService');
const escalationService = require('../services/escalationService');
const { getImpactedServices } = require('../services/serviceImpactService');

/* ============================
   HELPER: NORMALIZE INCIDENT RESPONSE
   ✅ Maps reportedBy → reporter for frontend compatibility
============================ */
const normalizeIncident = (incident) => {
  const incidentObj = incident.toObject ? incident.toObject() : incident;
  return {
    ...incidentObj,
    reporter: incidentObj.reportedBy,  // ✅ Frontend expects "reporter"
    responder: incidentObj.assignedTo  // ✅ Frontend expects "responder"
  };
};

const normalizeIncidents = (incidents) => {
  return incidents.map(normalizeIncident);
};

/* ============================
   CREATE INCIDENT
   ✅ FIXED: Now returns normalized response with "reporter" field
============================ */
const createIncident = async (req, res) => {
  try {
    const {
      title,
      description,
      severity,
      type,
      affectedService,
      impactedUsers,
      businessCriticality,
      serviceId
    } = req.body;

    // Set reported time
    const reportedAt = new Date();

    const { priority, severityScore } = calculatePriority(impactedUsers || 1, businessCriticality || 'LOW');

    // ✅ FIX: Always populate reportedBy from authenticated user
    const incident = await Incident.create({
      title,
      description,
      severity,
      type,
      priority,
      severityScore,
      businessCriticality: businessCriticality || 'LOW',
      impactedUsers: impactedUsers || 1,
      reportedBy: req.user.id,
      reportedByRole: req.user.role,
      reportedAt,
      serviceId: serviceId || null,
      status: 'OPEN',
      affectedService: affectedService || undefined
    });

    await logAudit('INCIDENT_CREATED', req.user.id, incident._id, {
      message: `Incident created with priority ${priority}`
    });

    // --- AUTO-ASSIGN TO ON-CALL ENGINEER (Round Robin) ---
    try {
      const now = new Date();
      const activePrimaryShifts = await OnCallSchedule.find({
        startTime: { $lte: now },
        endTime: { $gte: now },
        isActive: true,
        shiftType: 'PRIMARY'
      });

      if (activePrimaryShifts.length > 0) {
        let selectedUserId = activePrimaryShifts[0].user;

        // If multiple active engineers, find the one least recently assigned
        if (activePrimaryShifts.length > 1) {
          const userIds = activePrimaryShifts.map(shift => shift.user);

          // Get the most recent incident assignment for each active on-call user
          const recentIncidents = await Incident.aggregate([
            { $match: { assignedTo: { $in: userIds } } },
            { $sort: { assignedAt: -1, createdAt: -1 } },
            {
              $group: {
                _id: '$assignedTo',
                lastAssigned: { $first: { $ifNull: ['$assignedAt', '$createdAt'] } }
              }
            }
          ]);

          const assignmentMap = {};
          recentIncidents.forEach(item => {
            assignmentMap[item._id.toString()] = new Date(item.lastAssigned).getTime();
          });

          let oldestTime = Infinity;
          userIds.forEach(uid => {
            const time = assignmentMap[uid.toString()] || 0; // 0 means never assigned (gets priority)
            if (time < oldestTime) {
              oldestTime = time;
              selectedUserId = uid;
            }
          });
        }

        // Industrial Upgrade: Away / Do Not Disturb Auto-routing
        const assignedUserDoc = await User.findById(selectedUserId);
        if (assignedUserDoc && assignedUserDoc.isAway && assignedUserDoc.awayRouteTo) {
          const routeToUser = await User.findOne({
            _id: assignedUserDoc.awayRouteTo,
            role: 'RESPONDER',
            isActive: true
          });
          if (routeToUser) {
            selectedUserId = routeToUser._id;
          }
        }

        incident.assignedTo = selectedUserId;
        incident.assignedAt = new Date();
        incident.status = 'ASSIGNED';
        await incident.save();

        await logAudit('INCIDENT_AUTO_ASSIGNED', 'SYSTEM', incident._id, {
          assignedTo: selectedUserId,
          reason: activePrimaryShifts.length > 1 ? 'Auto-assigned via Round-Robin On-Call' : 'Auto-assigned to Primary On-Call Engineer'
        });

        // Trigger notification to Admin & Responder
        await notifyIncidentAutoAssigned(incident, selectedUserId);
      }
    } catch (onCallError) {
      console.error('Failed to auto-assign on-call:', onCallError);
    }

    // Attach SLA Policy
    try {
      await slaService.attachSLA(incident);
      // Incident is modified in memory, now save it
      await incident.save();
    } catch (slaError) {
      console.error('Failed to attach SLA:', slaError);
      // We don't fail the request, but we log it. 
      // In strict mode we might want to alert admin.
    }

    // Impacted Services Analysis
    if (serviceId) {
      try {
        const impactedServices = await getImpactedServices(serviceId);
        incident.impactedServices = impactedServices.map(s => s._id);
        await incident.save();

        await logAudit('SERVICE_IMPACT_ANALYSIS', req.user.id, incident._id, {
          serviceId,
          impactedCount: impactedServices.length
        });
      } catch (impactError) {
        console.error('Impact analysis error:', impactError);
      }
    }

    // Attach Escalation Policy
    try {
      await escalationService.assignPolicyToIncident(incident);
    } catch (escError) {
      console.error('Failed to attach escalation policy:', escError);
    }

    // ✅ Populate reporter details before sending response
    await incident.populate('reportedBy', 'name email role');

    // Log audit trail
    await logAudit('INCIDENT_CREATED', req.user.id, incident._id, {
      severity,
      title
    });

    await logAudit('PRIORITY_CALCULATED', req.user.id, incident._id, {
      priority,
      message: `Priority auto-calculated as ${priority}`
    });

    // Send notifications
    await notifyIncidentCreated(incident);

    // ✅ NORMALIZE: Add "reporter" field for frontend
    res.status(201).json({
      message: 'Incident created successfully',
      incident: normalizeIncident(incident)
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
   ✅ FIXED: Returns normalized response with "reporter" field
============================ */
/* ============================
   GET ALL INCIDENTS (Advanced Search & Filters)
   ✅ FIXED: Returns normalized response with "reporter" field
============================ */
const getAllIncidents = async (req, res) => {
  try {
    const {
      status,
      severity,
      type,
      search,
      startDate,
      endDate,
      assignedTo,
      priority,
      sortBy = 'createdAt',
      order = 'desc',
      page = 1,
      limit = 20
    } = req.query;

    const query = {};

    // 1. Role-based filtering constraints
    if (req.user.role === 'REPORTER') {
      query.reportedBy = req.user.id;
    }
    // Responder can generally see all tickets in many systems, 
    // or arguably just their team's. 
    // For now, adhering to "Responder sees all" or "Assigned only"?
    // The previous code had "if (req.user.role === 'RESPONDER') { query.assignedTo = req.user.id; }" 
    // This implies Responders only see their own tickets in the main list. 
    // Let's preserve that logic if it was intended, OR assume Responders need to see unassigned ones too.
    // The prompt implies "Advanced Search" for the list. 
    // Let's keep the user restriction for stricter security if that was the legacy behavior.
    if (req.user.role === 'RESPONDER') {
      // If Responders should see ALL tickets to pick them up, we shouldn't restrict this.
      // However, looking at line 107 of original file: 
      // "if (req.user.role === 'RESPONDER') { query.assignedTo = req.user.id; }"
      // This suggests strictly personal view. 
      // But typically there's a "Unassigned" view too.
      // Let's RELAX this specific constraint for "Search" purposes so they can find tickets to pick up?
      // Or keep it strict? 
      // Let's keep it strict for the "My Incidents" default behavior but maybe allow searching if explicitly asked?
      // Actually, typically Responders need to see Unassigned tickets to pick them.
      // Let's allow Responders to see Assigned to Them OR Unassigned.
      query.$or = [
        { assignedTo: req.user.id },
        { assignedTo: null }
      ];
    }

    // 2. Apply Filters
    if (status) query.status = status;
    if (severity) query.severity = severity;
    if (priority) query.priority = priority;
    if (type) query.type = type;
    if (assignedTo) query.assignedTo = assignedTo; // Admin filtering by user

    // 3. Search (Title/Description)
    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      // If we already have an $or from Responder logic, we need to be careful using $and
      const searchCondition = {
        $or: [
          { title: searchRegex },
          { description: searchRegex },
          { incidentNumber: searchRegex }
        ]
      };

      if (query.$or) {
        // Merge logic: (ResponderLogic) AND (SearchLogic)
        query.$and = [
          { $or: query.$or },
          searchCondition
        ];
        delete query.$or;
      } else {
        query.$or = searchCondition.$or;
      }
    }

    // 4. Date Range
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // End of day
        query.createdAt.$lte = end;
      }
    }

    // 5. Pagination
    const skip = (page - 1) * limit;

    // 6. Sorting
    const sort = {};
    sort[sortBy] = order === 'desc' ? -1 : 1;

    const incidents = await Incident.find(query)
      .populate('reportedBy', 'name email role')
      .populate('assignedTo', 'name email role')
      .populate('assignedTeam', 'name')
      .sort(sort) // Newest first by default
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Incident.countDocuments(query);

    res.json({
      success: true,
      incidents: normalizeIncidents(incidents),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Fetch incidents error:', error);
    res.status(500).json({ message: 'Failed to fetch incidents' });
  }
};

/* ============================
   GET MY ASSIGNED INCIDENTS (RESPONDER ONLY)
   ✅ FIXED: Returns normalized response with "reporter" field
============================ */
const getMyAssignedIncidents = async (req, res) => {
  try {
    const { status, severity, page = 1, limit = 20, search } = req.query;

    // Build query - only incidents assigned to this responder
    const query = { assignedTo: req.user.id };

    // Apply filters
    if (status) {
      query.status = status;
    }

    if (severity) {
      query.severity = severity;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch incidents
    const incidents = await Incident.find(query)
      .populate('reportedBy', 'name email role')
      .populate('assignedTo', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await Incident.countDocuments(query);

    // ✅ NORMALIZE: Add "reporter" field
    res.status(200).json({
      success: true,
      incidents: normalizeIncidents(incidents),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get my assigned incidents error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assigned incidents',
      error: error.message
    });
  }
};

/* ============================
   GET UNASSIGNED INCIDENTS
   ✅ FIXED: Returns normalized response with "reporter" field
============================ */
const getUnassignedIncidents = async (req, res) => {
  try {
    const incidents = await Incident.find({
      status: 'OPEN',
      assignedTo: null,
      assignedTeam: null
    })
      .populate('reportedBy', 'name email role')
      .populate('assignedTea', 'name')
      .sort({ createdAt: -1 });

    // ✅ NORMALIZE: Add "reporter" field
    res.json({
      success: true,
      count: incidents.length,
      incidents: normalizeIncidents(incidents)
    });
  } catch (error) {
    console.error('Fetch unassigned incidents error:', error);
    res.status(500).json({ message: 'Failed to fetch unassigned incidents' });
  }
};

/* ============================
   GET INCIDENT BY ID
   ✅ FIXED: Returns normalized response with "reporter" field
============================ */
const getIncidentById = async (req, res) => {
  try {
    // ✅ FIX: Populate both reportedBy and assignedTo
    const incident = await Incident.findById(req.params.id)
      .populate('reportedBy', 'name email role')
      .populate('assignedTo', 'name email role')
      .populate('assignedTeam', 'name')
      .populate('serviceId', 'name status criticality')
      .populate('impactedServices', 'name status criticality')
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

    // ✅ CHECK FOR BREACH (Lazy Update)
    if (slaService.checkSLABreached(incident)) {
      await incident.save();
    }

    // ✅ NORMALIZE: Add "reporter" field
    res.json({
      incident: normalizeIncident(incident)
    });
  } catch (error) {
    console.error('Fetch incident error:', error);
    res.status(500).json({ message: 'Failed to fetch incident' });
  }
};

/* ============================
   ASSIGN INCIDENT
   ✅ FIXED: Returns normalized response with "reporter" field
============================ */
/* ============================
   ASSIGN INCIDENT
   ✅ FIXED: Returns normalized response with "reporter" field
============================ */
const assignIncident = async (req, res) => {
  try {
    const { responderId, teamId } = req.body;
    const Team = require('../models/Team'); // Lazy load Team model

    // Validation
    if (!responderId && !teamId) {
      return res.status(400).json({ message: 'Responder ID or Team ID is required' });
    }

    // Find incident
    const incident = await Incident.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    // Check if already assigned
    if (incident.assignedTo || incident.assignedTeam) {
      return res.status(400).json({
        message: 'Incident is already assigned',
        currentResponder: incident.assignedTo,
        currentTeam: incident.assignedTeam
      });
    }

    let responder = null;
    let team = null;

    if (responderId) {
      // Verify responder exists and is active
      responder = await User.findOne({
        _id: responderId,
        role: 'RESPONDER',
        isActive: true
      });

      if (!responder) {
        return res.status(400).json({ message: 'Invalid responder or responder not found' });
      }

      // Industrial Upgrade: Away / Do Not Disturb Auto-routing
      if (responder.isAway && responder.awayRouteTo) {
        const routeToUser = await User.findOne({
          _id: responder.awayRouteTo,
          role: 'RESPONDER',
          isActive: true
        });
        if (routeToUser) {
          responder = routeToUser; // Swap the actual responder object
          responderId = routeToUser._id; // Update responderId
        }
      }

      incident.assignedTo = responderId;
    }

    if (teamId) {
      // Verify team exists
      team = await Team.findById(teamId);
      if (!team) {
        return res.status(400).json({ message: 'Team not found' });
      }
      incident.assignedTeam = teamId;
    }

    // Update status
    incident.status = 'INVESTIGATING';
    incident.assignedAt = new Date();

    await incident.save();

    // Populate fields
    await incident.populate('assignedTo', 'name email role');
    await incident.populate('assignedTeam', 'name');
    await incident.populate('reportedBy', 'name email role');

    // Log audit
    await logAudit('INCIDENT_ASSIGNED', req.user.id, incident._id, {
      responderId,
      responderName: responder ? responder.name : null,
      teamId,
      teamName: team ? team.name : null
    });

    // Send notification
    if (responder) {
      await notifyIncidentAssigned(incident, responder);
    }
    // TODO: Notify Team members if assigned to team (future enhancement)

    // ✅ NORMALIZE: Add "reporter" field
    res.json({
      message: 'Incident assigned successfully',
      incident: normalizeIncident(incident)
    });
  } catch (error) {
    console.error('Assignment error:', error);
    res.status(500).json({ message: 'Assignment failed' });
  }
};

/* ============================
   UPDATE STATUS
   ✅ FIXED: Returns normalized response with "reporter" field
============================ */
const updateIncidentStatus = async (req, res) => {
  try {
    const { status, rootCause, resolutionNotes } = req.body;

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

    // If resolved, set resolution time and KB fields
    if (status === 'RESOLVED') {
      incident.resolvedAt = new Date();
      incident.rootCause = rootCause || incident.rootCause;
      incident.resolutionNotes = resolutionNotes || incident.resolutionNotes;
      await notifyIncidentResolved(incident, incident.reportedBy);

      // Update Resolution SLA
      if (incident.slaResolutionStatus === 'PENDING') {
        // Check if actually met (is it before deadline?)
        const isMet = incident.slaResolutionDeadline ? (incident.resolvedAt <= incident.slaResolutionDeadline) : true;
        incident.slaResolutionStatus = isMet ? 'MET' : 'BREACHED';
        // Overall SLA status might still be breached if response was breached
        if (incident.slaStatus !== 'BREACHED' && isMet) {
          incident.slaStatus = 'MET';
        }
      }
    }

    // If moved to IN_PROGRESS/INVESTIGATING/ASSIGNED/RESOLVED, check Response SLA
    if (['INVESTIGATING', 'ASSIGNED', 'RESOLVED'].includes(status)) {
      if (incident.slaResponseStatus === 'PENDING') {
        const now = new Date();
        const isMet = incident.slaResponseDeadline ? (now <= incident.slaResponseDeadline) : true;
        incident.slaResponseStatus = isMet ? 'MET' : 'BREACHED';
      }
    }

    await incident.save();

    // Log audit
    await logAudit('STATUS_UPDATED', req.user.id, incident._id, {
      from: oldStatus,
      to: status
    });

    // Send status update notification
    await notifyStatusUpdate(incident, oldStatus, status);

    // ✅ NORMALIZE: Add "reporter" field
    res.json({
      message: 'Status updated',
      incident: normalizeIncident(incident)
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

    // Notify relevant parties
    if (!isInternal) {
      await notifyCommentAdded(incident, comment, req.user);
    }



    res.status(201).json({
      message: 'Comment added',
      comment: addedComment
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Failed to add comment' });
  }
};

/* ============================
   GET INCIDENT HISTORY
============================ */
const getIncidentHistory = async (req, res) => {
  try {
    const AuditLog = require('../models/AuditLog');
    const history = await AuditLog.find({ target: req.params.id })
      .populate('performedBy', 'name role')
      .sort({ createdAt: -1 });

    res.json(history);
  } catch (error) {
    console.error('Fetch history error:', error);
    res.status(500).json({ message: 'Failed to fetch incident history' });
  }
};

const updateIncidentPriority = async (req, res) => {
  try {
    const { priority } = req.body;
    const incident = await Incident.findById(req.params.id)
      .populate('reportedBy', 'name email role')
      .populate('assignedTo', 'name email role');

    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    if (!['ADMIN', 'RESPONDER'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const oldPriority = incident.priority;
    incident.priority = priority;
    incident.priorityManuallyOverridden = true;

    // SLA Auto Assignment Integration
    await slaService.attachSLA(incident);

    await incident.save();

    await logAudit('PRIORITY_MANUAL_OVERRIDE', req.user.id, incident._id, {
      message: `Priority manually changed from ${oldPriority} to ${priority}`
    });

    res.json({
      message: 'Priority updated correctly',
      incident: normalizeIncident(incident)
    });
  } catch (error) {
    console.error('Priority update error:', error);
    res.status(500).json({ message: 'Priority update failed' });
  }
};

/* ============================
   DELETE INCIDENT
   ✅ Added: Allows creator or ADMIN to delete incident
============================ */
const deleteIncident = async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    // Authorization: Only the creator or ADMIN can delete
    if (req.user.role !== 'ADMIN' && incident.reportedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied: You can only delete incidents that you created.' });
    }

    await Incident.findByIdAndDelete(req.params.id);

    await logAudit('INCIDENT_DELETED', req.user.id, incident._id, {
      title: incident.title
    });

    // Notify admins and responder
    await notifyIncidentDeleted(incident, req.user.id);

    res.json({ message: 'Incident deleted successfully' });
  } catch (error) {
    console.error('Delete incident error:', error);
    res.status(500).json({ message: 'Failed to delete incident' });
  }
};

/* ============================
   GET INCIDENT INSIGHTS
   ✅ Multi-dimensional analysis for decision-support
============================ */
const getIncidentInsights = async (req, res) => {
  try {
    const { id } = req.params;
    const incident = await Incident.findById(id)
      .populate('serviceId')
      .populate('impactedServices');

    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    // 1. Likely Root Cause
    let likelyRootCause = "Unknown - Diagnostic Required";
    if (incident.serviceId) {
      likelyRootCause = `${incident.serviceId.name} (Direct Failure)`;
    } else if (incident.affectedService) {
      likelyRootCause = `${incident.affectedService} (Reported)`;
    }

    // 2. Impacted Services
    const impacted = incident.impactedServices.map(s => s.name);

    // 3. Suggested Actions
    let suggestedActions = [
      "Check recent deployment logs for the master branch",
      "Assign a primary responder via the assignment tool",
      "Initiate internal communication flow"
    ];

    if (incident.priority === 'P0' || incident.priority === 'P1') {
      suggestedActions.unshift("IMMEDIATE: Notify executive bridge and start war room");
    }

    // 4. Similar Past Incidents (Basic Keywords)
    const keywords = incident.title.split(' ').filter(w => w.length > 3);
    const similarIncidents = await Incident.find({
      _id: { $ne: incident._id },
      $or: keywords.map(kw => ({ title: { $regex: kw, $options: 'i' } })),
      status: 'RESOLVED'
    })
    .limit(3)
    .select('title incidentNumber status createdAt');

    res.json({
      success: true,
      data: {
        likelyRootCause,
        impactedServices: impacted.length > 0 ? impacted : ["Minimal/None detected"],
        suggestedActions,
        similarIncidents: similarIncidents.map(inc => ({
          title: inc.title,
          id: inc._id,
          number: inc.incidentNumber || `INC-${inc._id.toString().slice(-8).toUpperCase()}`,
          date: inc.createdAt
        }))
      }
    });

  } catch (error) {
    console.error('Fetch insights error:', error);
    res.status(500).json({ message: 'Failed to fetch insights' });
  }
};

/* ============================
   GET SIMILAR INCIDENTS BY TITLE
   ✅ Real-time KB suggestions during creation
============================ */
const getSimilarIncidentsByTitle = async (req, res) => {
  try {
    const { title } = req.query;
    if (!title || title.length < 4) {
      return res.json({ success: true, count: 0, incidents: [] });
    }

    const keywords = title.split(' ').filter(w => w.length > 3);
    const incidents = await Incident.find({
      $or: keywords.map(kw => ({ title: { $regex: kw, $options: 'i' } })),
      status: 'RESOLVED'
    })
    .limit(5)
    .select('title incidentNumber status rootCause resolutionNotes');

    res.json({
      success: true,
      count: incidents.length,
      incidents
    });
  } catch (error) {
    console.error('KB Suggestion Error:', error);
    res.status(500).json({ message: 'Failed to fetch suggestions' });
  }
};

module.exports = {
  createIncident,
  getAllIncidents,
  getMyAssignedIncidents,
  getUnassignedIncidents,
  getIncidentById,
  assignIncident,
  updateIncidentStatus,
  getComments,
  addComment,
  getIncidentHistory,
  updateIncidentPriority,
  deleteIncident,
  getIncidentInsights,
  getSimilarIncidentsByTitle
};