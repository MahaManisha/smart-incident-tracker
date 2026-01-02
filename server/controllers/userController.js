const User = require('../models/user');
const Incident = require('../models/Incident');
const bcrypt = require('bcryptjs');
const { logAudit } = require('../middleware/auditLogger');
const { calculateResolutionTime, isSLAMet } = require('../services/slaService');

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const { role, isActive, page = 1, limit = 50 } = req.query;
    
    const query = {};
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    
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
    res.status(500).json({ 
      message: 'Error fetching users', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    // Authorization check - admin or self
    if (req.user.role !== 'ADMIN' && req.user.id !== req.params.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('teamId', 'name members');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get user stats if responder
    let stats = null;
    if (user.role === 'RESPONDER') {
      const assignedIncidents = await Incident.find({ responder: user._id });
      const resolvedIncidents = assignedIncidents.filter(
        inc => inc.status === 'RESOLVED' || inc.status === 'CLOSED'
      );
      
      let totalResolutionTime = 0;
      let metSLA = 0;
      
      resolvedIncidents.forEach(incident => {
        const time = calculateResolutionTime(incident);
        if (time) totalResolutionTime += time;
        if (isSLAMet(incident)) metSLA++;
      });
      
      stats = {
        totalAssigned: assignedIncidents.length,
        resolved: resolvedIncidents.length,
        inProgress: assignedIncidents.filter(inc => 
          ['ASSIGNED', 'INVESTIGATING'].includes(inc.status)
        ).length,
        avgResolutionTimeMinutes: resolvedIncidents.length > 0 
          ? Math.round(totalResolutionTime / resolvedIncidents.length) 
          : 0,
        slaComplianceRate: resolvedIncidents.length > 0 
          ? ((metSLA / resolvedIncidents.length) * 100).toFixed(2) 
          : 0
      };
    }
    
    res.json({
      user,
      stats
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ 
      message: 'Error fetching user', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

// Create user
const createUser = async (req, res) => {
  try {
    const { name, email, password, role, teamId } = req.body;
    
    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    
    // Validate team if provided
    if (teamId) {
      const Team = require('../models/Team');
      const team = await Team.findById(teamId);
      if (!team) {
        return res.status(400).json({ message: 'Invalid team ID' });
      }
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      teamId: teamId || null
    });
    
    // If user is a responder and has a team, add them to the team
    if (role === 'RESPONDER' && teamId) {
      const Team = require('../models/Team');
      await Team.findByIdAndUpdate(teamId, {
        $addToSet: { members: user._id }
      });
    }
    
    const userResponse = user.toObject();
    delete userResponse.password;
    
    // Log audit
    await logAudit('Created User', req.user.id, user._id, { 
      name, 
      email, 
      role 
    });
    
    res.status(201).json({
      message: 'User created successfully',
      user: userResponse
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ 
      message: 'Error creating user', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const { name, email, role, teamId, isActive } = req.body;
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if email is being changed and if it already exists
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      user.email = email;
    }
    
    if (name) user.name = name;
    if (role) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;
    
    // Handle team changes
    if (teamId !== undefined) {
      const Team = require('../models/Team');
      
      // Remove from old team if exists
      if (user.teamId) {
        await Team.findByIdAndUpdate(user.teamId, {
          $pull: { members: user._id }
        });
      }
      
      // Add to new team if provided
      if (teamId) {
        const team = await Team.findById(teamId);
        if (!team) {
          return res.status(400).json({ message: 'Invalid team ID' });
        }
        await Team.findByIdAndUpdate(teamId, {
          $addToSet: { members: user._id }
        });
      }
      
      user.teamId = teamId || null;
    }
    
    await user.save();
    
    const userResponse = user.toObject();
    delete userResponse.password;
    
    // Log audit
    await logAudit('Updated User', req.user.id, user._id, { name: user.name });
    
    res.json({
      message: 'User updated successfully',
      user: userResponse
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ 
      message: 'Error updating user', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

// Delete user (soft delete)
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if user has active incidents
    const activeIncidents = await Incident.countDocuments({
      $or: [
        { reporter: user._id, status: { $in: ['OPEN', 'ASSIGNED', 'INVESTIGATING'] } },
        { responder: user._id, status: { $in: ['ASSIGNED', 'INVESTIGATING'] } }
      ]
    });
    
    if (activeIncidents > 0) {
      return res.status(400).json({ 
        message: `Cannot delete user. User has ${activeIncidents} active incidents.` 
      });
    }
    
    // Soft delete
    user.isActive = false;
    await user.save();
    
    // Remove from team if exists
    if (user.teamId) {
      const Team = require('../models/Team');
      await Team.findByIdAndUpdate(user.teamId, {
        $pull: { members: user._id }
      });
    }
    
    // Log audit
    await logAudit('Deleted User', req.user.id, user._id, { name: user.name });
    
    res.json({
      message: 'User deactivated successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ 
      message: 'Error deleting user', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

// Update own profile
const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if email is being changed and if it already exists
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      user.email = email;
    }
    
    if (name) user.name = name;
    
    await user.save();
    
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.json({
      message: 'Profile updated successfully',
      user: userResponse
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ 
      message: 'Error updating profile', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    
    await user.save();
    
    // Log audit
    await logAudit('Changed Password', req.user.id, user._id);
    
    res.json({
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ 
      message: 'Error changing password', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

// Get user stats
const getUserStats = async (req, res) => {
  try {
    // Authorization check - admin or self
    if (req.user.role !== 'ADMIN' && req.user.id !== req.params.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    let stats = {};
    
    if (user.role === 'RESPONDER') {
      const assignedIncidents = await Incident.find({ responder: user._id });
      const resolvedIncidents = assignedIncidents.filter(
        inc => inc.status === 'RESOLVED' || inc.status === 'CLOSED'
      );
      const openIncidents = assignedIncidents.filter(
        inc => ['ASSIGNED', 'INVESTIGATING'].includes(inc.status)
      );
      
      let totalResolutionTime = 0;
      let metSLA = 0;
      
      resolvedIncidents.forEach(incident => {
        const time = calculateResolutionTime(incident);
        if (time) totalResolutionTime += time;
        if (isSLAMet(incident)) metSLA++;
      });
      
      stats = {
        totalAssigned: assignedIncidents.length,
        resolved: resolvedIncidents.length,
        inProgress: openIncidents.length,
        avgResolutionTimeMinutes: resolvedIncidents.length > 0 
          ? Math.round(totalResolutionTime / resolvedIncidents.length) 
          : 0,
        avgResolutionTimeHours: resolvedIncidents.length > 0 
          ? Math.round(totalResolutionTime / resolvedIncidents.length / 60) 
          : 0,
        slaComplianceRate: resolvedIncidents.length > 0 
          ? ((metSLA / resolvedIncidents.length) * 100).toFixed(2) 
          : 0,
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
        inProgress: reportedIncidents.filter(inc => 
          ['ASSIGNED', 'INVESTIGATING'].includes(inc.status)
        ).length,
        resolved: reportedIncidents.filter(inc => 
          ['RESOLVED', 'CLOSED'].includes(inc.status)
        ).length,
        bySeverity: {
          CRITICAL: reportedIncidents.filter(inc => inc.severity === 'CRITICAL').length,
          HIGH: reportedIncidents.filter(inc => inc.severity === 'HIGH').length,
          MEDIUM: reportedIncidents.filter(inc => inc.severity === 'MEDIUM').length,
          LOW: reportedIncidents.filter(inc => inc.severity === 'LOW').length
        }
      };
    }
    
    res.json({
      userId: user._id,
      name: user.name,
      role: user.role,
      stats
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ 
      message: 'Error fetching user stats', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
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
  getUserStats
};