const User = require('../models/User');
const Team = require('../models/Team');
const Incident = require('../models/Incident');
const bcrypt = require('bcryptjs');
const { logAudit } = require('../middleware/auditLogger');
const { calculateResolutionTime, isSLAMet } = require('../services/slaService');
const mongoose = require('mongoose');

// --- Get all users ---
const getAllUsers = async (req, res) => {
  try {
    const { role, isActive, page = 1, limit = 50 } = req.query;

    const query = {};
    query.isActive = isActive !== undefined ? isActive === 'true' : true;
    if (role) query.role = role;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find(query)
      .select('-password')
      .populate('teamId', 'name')
      .sort({ name: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// --- Get user by ID ---
const getUserById = async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN' && req.user.id !== req.params.id) return res.status(403).json({ message: 'Access denied' });

    const user = await User.findById(req.params.id).select('-password').populate('teamId', 'name members');

    if (!user || user.isActive === false) return res.status(404).json({ message: 'User not found' });

    let stats = null;
    if (user.role === 'RESPONDER') {
      const assignedIncidents = await Incident.find({ responder: user._id });
      const resolvedIncidents = assignedIncidents.filter(inc => ['RESOLVED', 'CLOSED'].includes(inc.status));
      let totalResolutionTime = 0;
      let metSLA = 0;

      resolvedIncidents.forEach(inc => {
        const time = calculateResolutionTime(inc);
        if (time) totalResolutionTime += time;
        if (isSLAMet(inc)) metSLA++;
      });

      stats = {
        totalAssigned: assignedIncidents.length,
        resolved: resolvedIncidents.length,
        inProgress: assignedIncidents.filter(inc => ['ASSIGNED', 'INVESTIGATING'].includes(inc.status)).length,
        avgResolutionTimeMinutes: resolvedIncidents.length ? Math.round(totalResolutionTime / resolvedIncidents.length) : 0,
        slaComplianceRate: resolvedIncidents.length ? ((metSLA / resolvedIncidents.length) * 100).toFixed(2) : 0
      };
    }

    res.json({ user, stats });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Error fetching user', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// --- Create user ---
const createUser = async (req, res) => {
  try {
    const { name, email, password, role, teamId, phoneNumber } = req.body;

    if (!name || !email || !password || !role) return res.status(400).json({ message: 'Name, email, password, and role are required' });

    // Validate phone number if provided
    if (phoneNumber) {
      const phoneRegex = /^\+?[0-9]{7,15}$/; // Basic international format check
      if (!phoneRegex.test(phoneNumber.trim())) {
        return res.status(400).json({ message: 'Invalid phone number format' });
      }
    }

    // Only active users block email
    const existingUser = await User.findOne({ email, isActive: true });
    if (existingUser) return res.status(400).json({ message: 'Email already registered' });

    let team = null;
    if (teamId) {
      if (!mongoose.Types.ObjectId.isValid(teamId)) return res.status(400).json({ message: 'Invalid team ID format' });
      team = await Team.findById(teamId);
      if (!team) return res.status(400).json({ message: 'Team not found' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      teamId: team ? team._id : null,
      isActive: true,
      phoneNumber: phoneNumber ? phoneNumber.trim() : ""
    });

    if (role === 'RESPONDER' && team) {
      await Team.findByIdAndUpdate(team._id, { $addToSet: { members: user._id } });
    }

    const userResponse = user.toObject();
    delete userResponse.password;

    await logAudit('Created User', req.user.id, user._id, { name, email, role });

    res.status(201).json({ message: 'User created successfully', user: userResponse });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Error creating user', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// --- Update user ---
const updateUser = async (req, res) => {
  try {
    const { name, email, role, teamId, isActive, phoneNumber } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email, isActive: true, _id: { $ne: user._id } });
      if (existingUser) return res.status(400).json({ message: 'Email already in use' });
      user.email = email;
    }

    if (name) user.name = name;
    if (role) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;

    // Update Phone Number
    if (phoneNumber !== undefined) {
      if (phoneNumber && phoneNumber.trim() !== "") {
        const phoneRegex = /^\+?[0-9]{7,15}$/;
        if (!phoneRegex.test(phoneNumber.trim())) {
          return res.status(400).json({ message: 'Invalid phone number format' });
        }
        user.phoneNumber = phoneNumber.trim();
      } else {
        user.phoneNumber = ""; // Clear if empty
      }
    }

    if (teamId !== undefined) {
      if (user.teamId) await Team.findByIdAndUpdate(user.teamId, { $pull: { members: user._id } });
      if (teamId) {
        if (!mongoose.Types.ObjectId.isValid(teamId)) return res.status(400).json({ message: 'Invalid team ID format' });
        const team = await Team.findById(teamId);
        if (!team) return res.status(400).json({ message: 'Team not found' });
        await Team.findByIdAndUpdate(team._id, { $addToSet: { members: user._id } });
      }
      user.teamId = teamId || null;
    }

    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    await logAudit('Updated User', req.user.id, user._id, { name: user.name });

    res.json({ message: 'User updated successfully', user: userResponse });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Error updating user', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// --- Delete user (soft delete) ---
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.isActive === false) return res.status(404).json({ message: 'User not found or already deleted' });

    const activeIncidents = await Incident.countDocuments({
      $or: [
        { reporter: user._id, status: { $in: ['OPEN', 'ASSIGNED', 'INVESTIGATING'] } },
        { responder: user._id, status: { $in: ['ASSIGNED', 'INVESTIGATING'] } }
      ]
    });
    if (activeIncidents > 0) return res.status(400).json({ message: `Cannot delete user. ${activeIncidents} active incidents exist.` });

    user.isActive = false;
    await user.save();

    if (user.teamId) await Team.findByIdAndUpdate(user.teamId, { $pull: { members: user._id } });

    await logAudit('Deleted User', req.user.id, user._id, { name: user.name });

    res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Error deleting user', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// --- Update own profile ---
const updateProfile = async (req, res) => {
  try {
    const { name } = req.body;
    const user = await User.findById(req.user.id);
    if (!user || user.isActive === false) return res.status(404).json({ message: 'User not found' });

    // STRICT: Only allow name and profileImage updates

    if (name) user.name = name;
    
    // Industrial Upgrade: Allow user to update phone number
    if (req.body.phoneNumber !== undefined) {
      const phoneRegex = /^\+?[0-9]{7,15}$/;
      if (req.body.phoneNumber && req.body.phoneNumber.trim() !== "") {
        if (!phoneRegex.test(req.body.phoneNumber.trim())) {
          return res.status(400).json({ message: 'Invalid phone number format' });
        }
        user.phoneNumber = req.body.phoneNumber.trim();
      } else {
        user.phoneNumber = ""; // Clear if empty
      }
    }

    // Industrial Upgrade: Allow user to update notification preferences
    if (req.body.notificationPreferences) {
      try {
        let prefs = typeof req.body.notificationPreferences === 'string' 
          ? JSON.parse(req.body.notificationPreferences) 
          : req.body.notificationPreferences;
        
        if (prefs.emailThreshold) user.notificationPreferences.emailThreshold = prefs.emailThreshold;
        if (prefs.smsThreshold) user.notificationPreferences.smsThreshold = prefs.smsThreshold;
        if (prefs.pushThreshold) user.notificationPreferences.pushThreshold = prefs.pushThreshold;
      } catch (e) {
        console.error("Error parsing notificationPreferences:", e);
      }
    }

    // Industrial Upgrade: Allow user to update Away status and routing
    if (req.body.isAway !== undefined) {
      let isAway = req.body.isAway;
      if (typeof isAway === 'string') isAway = isAway === 'true';
      user.isAway = isAway;
      if (isAway && req.body.awayRouteTo) {
        user.awayRouteTo = req.body.awayRouteTo;
      } else {
        user.awayRouteTo = null;
      }
    }

    // Handle image upload
    if (req.file) {
      // Create relative path for frontend access (e.g., "uploads/user-123.jpg")
      // Normalize path separators to forward slashes for URL compatibility
      user.profileImage = req.file.path.replace(/\\/g, '/');
    }

    await user.save();

    // Log audit
    await logAudit('Updated Profile', req.user.id, user._id, { name: user.name });

    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({ message: 'Profile updated successfully', user: userResponse });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Error updating profile', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// --- Change password (Enhanced) ---
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    // Validate new password length
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long'
      });
    }

    // Check if new password is same as current
    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from current password'
      });
    }

    // Fetch user from database
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is inactive'
      });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in database
    user.password = hashedPassword;
    await user.save();

    // Log password change for audit trail
    await logAudit('Changed Password', req.user.id, user._id);
    console.log(`Password changed for user: ${user.email} at ${new Date().toISOString()}`);

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({
      success: false,
      message: 'Error changing password',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// --- Get user stats ---
const getUserStats = async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN' && req.user.id !== req.params.id) return res.status(403).json({ message: 'Access denied' });

    const user = await User.findById(req.params.id);
    if (!user || user.isActive === false) return res.status(404).json({ message: 'User not found' });

    let stats = {};
    if (user.role === 'RESPONDER') {
      const assignedIncidents = await Incident.find({ responder: user._id });
      const resolvedIncidents = assignedIncidents.filter(inc => ['RESOLVED', 'CLOSED'].includes(inc.status));
      const openIncidents = assignedIncidents.filter(inc => ['ASSIGNED', 'INVESTIGATING'].includes(inc.status));
      let totalResolutionTime = 0;
      let metSLA = 0;
      resolvedIncidents.forEach(inc => { totalResolutionTime += calculateResolutionTime(inc) || 0; if (isSLAMet(inc)) metSLA++; });

      stats = {
        totalAssigned: assignedIncidents.length,
        resolved: resolvedIncidents.length,
        inProgress: openIncidents.length,
        avgResolutionTimeMinutes: resolvedIncidents.length ? Math.round(totalResolutionTime / resolvedIncidents.length) : 0,
        avgResolutionTimeHours: resolvedIncidents.length ? Math.round(totalResolutionTime / resolvedIncidents.length / 60) : 0,
        slaComplianceRate: resolvedIncidents.length ? ((metSLA / resolvedIncidents.length) * 100).toFixed(2) : 0,
        bySeverity: {
          CRITICAL: assignedIncidents.filter(inc => inc.severity === 'CRITICAL').length,
          HIGH: assignedIncidents.filter(inc => inc.severity === 'HIGH').length,
          MEDIUM: assignedIncidents.filter(inc => inc.severity === 'MEDIUM').length,
          LOW: assignedIncidents.filter(inc => inc.severity === 'LOW').length
        },
        recentIncidents: openIncidents.slice(0, 5).map(inc => ({
          id: inc._id,
          incidentNumber: inc.incidentNumber,
          title: inc.title,
          severity: inc.severity,
          status: inc.status,
          slaDeadline: inc.slaDeadline
        }))
      };
    } else if (user.role === 'REPORTER') {
      const reportedIncidents = await Incident.find({ reporter: user._id });
      stats = {
        totalReported: reportedIncidents.length,
        open: reportedIncidents.filter(inc => inc.status === 'OPEN').length,
        inProgress: reportedIncidents.filter(inc => ['ASSIGNED', 'INVESTIGATING'].includes(inc.status)).length,
        resolved: reportedIncidents.filter(inc => ['RESOLVED', 'CLOSED'].includes(inc.status)).length,
        bySeverity: {
          CRITICAL: reportedIncidents.filter(inc => inc.severity === 'CRITICAL').length,
          HIGH: reportedIncidents.filter(inc => inc.severity === 'HIGH').length,
          MEDIUM: reportedIncidents.filter(inc => inc.severity === 'MEDIUM').length,
          LOW: reportedIncidents.filter(inc => inc.severity === 'LOW').length
        }
      };
    }

    res.json({ userId: user._id, name: user.name, role: user.role, stats });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ message: 'Error fetching user stats', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// --- Logout from all sessions ---
const logoutAll = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Invalidate sessions by updating tokenVersion (assuming frontend checks this or JWT secret rotation strategy)
    // For simple JWT stateless, we can track a validNotBefore timestamp in the user model
    user.validTokensAfter = new Date();
    await user.save();

    await logAudit('Logged out all sessions', req.user.id, user._id);

    res.json({ message: 'Successfully logged out from all other sessions' });
  } catch (error) {
    console.error('Error logging out all sessions:', error);
    res.status(500).json({ message: 'Error logging out all sessions', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateProfile,
  changePassword,
  getUserStats,
  logoutAll
};