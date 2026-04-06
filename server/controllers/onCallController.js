const OnCallSchedule = require('../models/OnCallSchedule');
const User = require('../models/User');
const { logAudit } = require('../middleware/auditLogger');

/**
 * Create a new on-call schedule entry
 */
exports.createSchedule = async (req, res) => {
    try {
        const { userId, teamId, startTime, endTime, shiftType } = req.body;

        if (!userId || !startTime || !endTime) {
            return res.status(400).json({ message: 'User, start time, and end time are required' });
        }

        // Check for overlap for the same user (standard practice)
        const overlap = await OnCallSchedule.findOne({
            user: userId,
            isActive: true,
            $or: [
                { startTime: { $lte: new Date(endTime) }, endTime: { $gte: new Date(startTime) } }
            ]
        });

        if (overlap) {
            return res.status(400).json({ message: 'User already has an active overlapping schedule' });
        }

        const schedule = await OnCallSchedule.create({
            user: userId,
            team: teamId || null,
            startTime,
            endTime,
            shiftType: shiftType || 'PRIMARY',
            createdBy: req.user.id
        });

        await logAudit('CREATED_ONCALL_SCHEDULE', req.user.id, schedule._id, { user: userId, shiftType });

        res.status(201).json({ message: 'On-call schedule created', schedule });
    } catch (error) {
        res.status(500).json({ message: 'Error creating schedule', error: error.message });
    }
};

/**
 * Get all active on-call schedules with populated user details
 */
exports.getAllSchedules = async (req, res) => {
    try {
        const { teamId } = req.query;
        const filter = { isActive: true };
        if (teamId) filter.team = teamId;

        const schedules = await OnCallSchedule.find(filter)
            .populate('user', 'name email role')
            .populate('team', 'name')
            .sort({ startTime: 1 });

        res.json(schedules);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching schedules' });
    }
};

/**
 * Get the currently active on-call users across all tiers (PRIMARY, SECONDARY, TERTIARY)
 */
exports.getCurrentOnCall = async (req, res) => {
    try {
        const now = new Date();

        // Find all currently active shifts
        const activeShifts = await OnCallSchedule.find({
            startTime: { $lte: now },
            endTime: { $gte: now },
            isActive: true
        })
        .sort({ shiftType: 1, startTime: -1 })
        .populate('user', 'name email role');

        const categorizedShifts = {
            PRIMARY: activeShifts.filter(s => s.shiftType === 'PRIMARY'),
            SECONDARY: activeShifts.filter(s => s.shiftType === 'SECONDARY'),
            TERTIARY: activeShifts.filter(s => s.shiftType === 'TERTIARY')
        };

        res.json(categorizedShifts);
    } catch (error) {
        res.status(500).json({ message: 'Error finding current on-call users' });
    }
};

/**
 * Delete (deactivate) a schedule entry
 */
exports.deleteSchedule = async (req, res) => {
    try {
        const schedule = await OnCallSchedule.findById(req.params.id);
        if (!schedule) return res.status(404).json({ message: 'Schedule not found' });

        // Soft delete
        schedule.isActive = false;
        await schedule.save();

        await logAudit('DELETED_ONCALL_SCHEDULE', req.user.id, schedule._id);
        res.json({ message: 'Schedule deactivated' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting schedule' });
    }
};
