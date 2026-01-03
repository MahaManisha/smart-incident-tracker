const Team = require('../models/Team');
const User = require('../models/user');

// @desc    Get all teams
// @route   GET /api/teams
// @access  Private (Admin, Responder)
exports.getAllTeams = async (req, res) => {
  try {
    const teams = await Team.find()
      .populate('members', 'name email role')
      .populate('lead', 'name email')
      .populate('createdBy', 'name email')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: teams.length,
      teams,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

// @desc    Get single team by ID
// @route   GET /api/teams/:id
// @access  Private (Admin, Responder)
exports.getTeamById = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('members', 'name email role')
      .populate('lead', 'name email')
      .populate('createdBy', 'name email');

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found',
      });
    }

    res.status(200).json({
      success: true,
      team,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

// @desc    Create new team
// @route   POST /api/teams
// @access  Private (Admin)
exports.createTeam = async (req, res) => {
  try {
    const { name, description, members, lead } = req.body;

    // Validation
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Team name is required',
      });
    }

    // Check if team with same name exists
    const existingTeam = await Team.findOne({ name });
    if (existingTeam) {
      return res.status(400).json({
        success: false,
        message: 'Team with this name already exists',
      });
    }

    // Verify members exist
    if (members && members.length > 0) {
      const memberCount = await User.countDocuments({
        _id: { $in: members },
      });
      if (memberCount !== members.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more members not found',
        });
      }
    }

    const team = await Team.create({
      name,
      description,
      members: members || [],
      lead,
      createdBy: req.user._id, // Add createdBy from authenticated user
    });

    const populatedTeam = await Team.findById(team._id)
      .populate('members', 'name email role')
      .populate('lead', 'name email')
      .populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Team created successfully',
      team: populatedTeam,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

// @desc    Update team
// @route   PATCH /api/teams/:id
// @access  Private (Admin)
exports.updateTeam = async (req, res) => {
  try {
    const { name, description, members, lead } = req.body;

    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found',
      });
    }

    // Check if new name conflicts with existing team
    if (name && name !== team.name) {
      const existingTeam = await Team.findOne({ name });
      if (existingTeam) {
        return res.status(400).json({
          success: false,
          message: 'Team with this name already exists',
        });
      }
    }

    // Verify members exist
    if (members && members.length > 0) {
      const memberCount = await User.countDocuments({
        _id: { $in: members },
      });
      if (memberCount !== members.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more members not found',
        });
      }
    }

    // Update fields
    if (name) team.name = name;
    if (description !== undefined) team.description = description;
    if (members) team.members = members;
    if (lead) team.lead = lead;

    await team.save();

    const updatedTeam = await Team.findById(team._id)
      .populate('members', 'name email role')
      .populate('lead', 'name email')
      .populate('createdBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Team updated successfully',
      team: updatedTeam,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

// @desc    Delete team
// @route   DELETE /api/teams/:id
// @access  Private (Admin)
exports.deleteTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found',
      });
    }

    await team.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Team deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

// @desc    Add member to team
// @route   POST /api/teams/:id/members
// @access  Private (Admin)
exports.addTeamMember = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }

    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found',
      });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if user is already a member
    if (team.members.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: 'User is already a team member',
      });
    }

    team.members.push(userId);
    await team.save();

    const updatedTeam = await Team.findById(team._id)
      .populate('members', 'name email role')
      .populate('lead', 'name email')
      .populate('createdBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Member added to team successfully',
      team: updatedTeam,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

// @desc    Remove member from team
// @route   DELETE /api/teams/:id/members/:userId
// @access  Private (Admin)
exports.removeTeamMember = async (req, res) => {
  try {
    const { id, userId } = req.params;

    const team = await Team.findById(id);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found',
      });
    }

    // Check if user is a member
    if (!team.members.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: 'User is not a team member',
      });
    }

    team.members = team.members.filter(
      (memberId) => memberId.toString() !== userId
    );
    await team.save();

    const updatedTeam = await Team.findById(team._id)
      .populate('members', 'name email role')
      .populate('lead', 'name email')
      .populate('createdBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Member removed from team successfully',
      team: updatedTeam,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};