const Incident = require('../models/Incident');
const EscalationPolicy = require('../models/EscalationPolicy');
const OnCallSchedule = require('../models/OnCallSchedule');
const User = require('../models/user');
const { logAudit } = require('../middleware/auditLogger');
const { sendEmail } = require('./emailService'); // Assuming this exists for notification
const { createNotification } = require('./notificationService');

/**
 * Attaches the default escalation policy to an incident and calculates the first threshold.
 */
const attachDefaultPolicy = async (incident) => {
    try {
        const policy = await EscalationPolicy.findOne({ isDefault: true }) || await EscalationPolicy.findOne();
        if (!policy) return;

        incident.escalationPolicy = policy._id;
        incident.escalationLevel = 1;
        incident.escalationStartedAt = new Date();

        const currentLevel = policy.levels.find(l => l.levelNumber === 1);
        if (currentLevel) {
            const nextAt = new Date();
            nextAt.setMinutes(nextAt.getMinutes() + currentLevel.escalateAfterMinutes);
            incident.nextEscalationAt = nextAt;
        }

        await incident.save();
        await logAudit('Escalation system initialized', null, incident._id, { policy: policy.name });
    } catch (error) {
        console.error('Error attaching escalation policy:', error);
    }
};

/**
 * Main escalation engine logic.
 * Runs periodically to find and escalate breached incidents.
 */
const processEscalations = async () => {
    try {
        const now = new Date();
        const activeIncidents = await Incident.find({
            escalationStatus: 'ACTIVE',
            nextEscalationAt: { $lte: now },
            status: { $nin: ['RESOLVED', 'CLOSED'] }
        }).populate('escalationPolicy');

        for (const incident of activeIncidents) {
            await escalateIncident(incident);
        }
    } catch (error) {
        console.error('Escalation Engine Error:', error);
    }
};

const escalateIncident = async (incident) => {
    const policy = incident.escalationPolicy;
    if (!policy) return;

    const nextLevelNumber = incident.escalationLevel + 1;
    const nextLevel = policy.levels.find(l => l.levelNumber === nextLevelNumber);

    if (!nextLevel) {
        incident.escalationStatus = 'COMPLETED';
        await incident.save();
        await logAudit('Escalation path exhausted', null, incident._id);
        return;
    }

    // --- REASSIGNMENT LOGIC ---
    let newAssigneeId = null;

    if (nextLevel.escalateToUser) {
        newAssigneeId = nextLevel.escalateToUser;
    } else {
        // Check for Secondary On-Call as a priority fallback
        const now = new Date();
        const secondaryOnCall = await OnCallSchedule.findOne({
            startTime: { $lte: now },
            endTime: { $gte: now },
            isActive: true,
            shiftType: 'SECONDARY'
        });

        if (secondaryOnCall) {
            newAssigneeId = secondaryOnCall.user;
        } else if (nextLevel.escalateToTeam) {
            // Escalate to team lead or random member from team
            const team = await mongoose.model('Team').findById(nextLevel.escalateToTeam).populate('members');
            if (team && team.members.length > 0) {
                newAssigneeId = team.members[0]._id; // Simplification: pick first member
            }
        } else if (nextLevel.escalateToRole) {
            // Find first available user with that role
            const user = await User.findOne({ role: nextLevel.escalateToRole, isActive: true });
            if (user) newAssigneeId = user._id;
        }
    }

    // --- UPDATE INCIDENT ---
    const oldLevel = incident.escalationLevel;
    incident.escalationLevel = nextLevelNumber;
    incident.lastEscalatedAt = new Date();
    incident.isEscalated = true;

    if (newAssigneeId) {
        incident.assignedTo = newAssigneeId;
        incident.status = 'ASSIGNED'; // Ensure it's marked as assigned
    }

    // Calculate next threshold
    const nextThreshold = policy.levels.find(l => l.levelNumber === nextLevelNumber + 1);
    if (nextThreshold) {
        const nextAt = new Date();
        nextAt.setMinutes(nextAt.getMinutes() + nextThreshold.escalateAfterMinutes);
        incident.nextEscalationAt = nextAt;
    } else {
        incident.nextEscalationAt = null;
        incident.escalationStatus = 'ESCALATED'; // Final stage reached
    }

    await incident.save();

    // --- AUDIT & NOTIFY ---
    await logAudit(`Escalated to Level ${nextLevelNumber}`, null, incident._id, {
        from: oldLevel,
        to: nextLevelNumber,
        assignedTo: newAssigneeId
    });

    // Notify new assignee
    if (newAssigneeId) {
        await createNotification({
            user: newAssigneeId,
            type: 'INCIDENT_ASSIGNED',
            title: 'Emergency Escalation',
            message: `Incident ${incident.incidentNumber} escalated to Level ${nextLevelNumber}. You are now the primary responder.`,
            incidentId: incident._id
        });
    }
};

// Start the engine
const startEscalationEngine = () => {
    console.log('--- Escalation Engine Started (Interval: 1 min) ---');
    setInterval(processEscalations, 60000);
};

module.exports = {
    attachDefaultPolicy,
    startEscalationEngine,
    processEscalations
};
