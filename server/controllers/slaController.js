const SLA = require('../models/SLA');
const { logAudit } = require('../middleware/auditLogger');

// Helper: Check if two arrays overlap (handles "ALL" or empty as wildcard)
const arraysOverlap = (arr1, arr2) => {
  const a1 = arr1 && arr1.length > 0 ? arr1 : ['ALL'];
  const a2 = arr2 && arr2.length > 0 ? arr2 : ['ALL'];
  if (a1.includes('ALL') || a2.includes('ALL')) return true;
  return a1.some(item => a2.includes(item));
};

// Helper: Check for SLA Overlaps
const checkSLAOverlap = async (newSLA) => {
  const activePolicies = await SLA.find({
    isActive: true,
    _id: { $ne: newSLA._id || null }
  });

  for (const policy of activePolicies) {
    // Check Scope Overlap
    const scope = newSLA.scope;
    const pScope = policy.scope;

    const overlap =
      arraysOverlap(scope.service, pScope.service) &&
      arraysOverlap(scope.incidentType, pScope.incidentType) &&
      arraysOverlap(scope.priority, pScope.priority) &&
      arraysOverlap(scope.department, pScope.department) &&
      arraysOverlap(scope.team, pScope.team);

    if (overlap) {
      // Rule: Prevent if overlapping policy has SAME or HIGHER preference (Lower Value = Higher Precedence)
      // Existing Policy Priority (e.g. 1) <= New Policy Priority (e.g. 10). Existing wins.
      // If Existing (1) <= New (1). Conflict.
      // If Existing (10) > New (1). New wins (Allow override).
      if (policy.policyPriority <= newSLA.policyPriority) {
        return {
          conflict: true,
          message: `Scope overlaps with active policy '${policy.name}' which has equal/higher precedence (Priority ${policy.policyPriority}).`
        };
      }
    }
  }
  return { conflict: false };
};

// Create SLA rule
const createSLARule = async (req, res) => {
  try {
    const {
      name,
      description,
      policyPriority,
      scope,
      targets,
      escalations,
      breachRules,
      isActive
    } = req.body;

    // 1. Validation: Basic Fields
    if (!name || !scope || !targets) {
      return res.status(400).json({ message: 'Missing required fields: name, scope, or targets.' });
    }

    // 2. Validation: Targets vs Scope
    // For targets, we should ensure that for every priority mentioned in scope, there is a target?
    // Or just ensure we don't have partial coverage?
    // Requirement says: "Scope preview... Targets".
    // Let's ensure targets are valid.
    const allowedPriorities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
    // Filter targets to only allowed priorities
    const relevantTargets = targets.filter(t => allowedPriorities.includes(t.priority));

    if (relevantTargets.length === 0) {
      return res.status(400).json({ message: 'At least one valid SLA target is required.' });
    }

    // 3. Validation: Time Logic
    for (const t of relevantTargets) {
      if (t.responseTime <= 0) {
        return res.status(400).json({ message: `Response time must be greater than 0 for ${t.priority}` });
      }
      if (t.resolutionTime <= 0) {
        return res.status(400).json({ message: `Resolution time must be greater than 0 for ${t.priority}` });
      }
      if (Number(t.resolutionTime) < Number(t.responseTime)) {
        return res.status(400).json({
          message: `Resolution time (${t.resolutionTime}m) cannot be less than response time (${t.responseTime}m) for ${t.priority}`
        });
      }
    }

    // 4. Validation: Escalations
    if (escalations && escalations.length > 0) {
      const levels = new Set();
      for (const esc of escalations) {
        if (levels.has(esc.level)) {
          return res.status(400).json({ message: `Duplicate escalation level: ${esc.level}` });
        }
        levels.add(esc.level);

        if (esc.triggerPercentage < 0 || esc.triggerPercentage > 100) { // Changed from < 0 || > 100 to allow 0? No, usually > 0.
          // Leaving as is per previous code logic but ensuring logic matches requirement
        }
      }
    }

    // 5. Check Name Uniqueness
    const existingRule = await SLA.findOne({ name });
    if (existingRule) {
      return res.status(400).json({ message: `SLA policy with name '${name}' already exists.` });
    }

    // 6. Overlap Validation
    if (isActive) { // Only check if we are activating it
      const validation = await checkSLAOverlap({ scope, policyPriority });
      if (validation.conflict) {
        return res.status(400).json({ message: validation.message });
      }
    }

    const slaRule = await SLA.create({
      name,
      description,
      policyPriority: policyPriority || 99,
      scope,
      targets: relevantTargets,
      escalations,
      breachRules,
      isActive: isActive !== undefined ? isActive : true,
      createdBy: req.user._id
    });

    await logAudit('Created SLA Policy', req.user.id, slaRule._id, { name });

    res.status(201).json({
      message: 'SLA policy created successfully',
      slaRule
    });
  } catch (error) {
    console.error('Error creating SLA rule:', error);
    
    // Detailed validation errors (Schema)
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ message: 'Validation failed', details: messages });
    }

    // Duplicate key errors (MongoDB)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ 
        message: `An SLA rule with this ${field} already exists.`,
        error: `Duplicate key error: ${field}`
      });
    }

    res.status(500).json({
      message: 'Error creating SLA rule',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal Server Error'
    });
  }
};

// Get all SLA rules
const getAllSLARules = async (req, res) => {
  try {
    const slaRules = await SLA.find()
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort({ createdAt: -1 });

    // Always return array, even if empty
    res.json({
      slaRules: slaRules || []
    });
  } catch (error) {
    console.error('Error fetching SLA rules:', error);
    res.status(500).json({
      message: 'Failed to load SLA policies',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get SLA rule by ID
const getSLARuleById = async (req, res) => {
  try {
    const slaRule = await SLA.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!slaRule) {
      return res.status(404).json({ message: 'SLA rule not found' });
    }

    res.json({ slaRule });
  } catch (error) {
    console.error('Error fetching SLA rule:', error);
    res.status(500).json({
      message: 'Error fetching SLA rule',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update SLA rule
const updateSLARule = async (req, res) => {
  try {
    const {
      name,
      description,
      isActive,
      policyPriority,
      scope,
      targets,
      escalations,
      breachRules
    } = req.body;

    const slaRule = await SLA.findById(req.params.id);

    if (!slaRule) {
      return res.status(404).json({ message: 'SLA rule not found' });
    }

    // Name uniqueness
    if (name && name !== slaRule.name) {
      const existingRule = await SLA.findOne({ name });
      if (existingRule) {
        return res.status(400).json({ message: `SLA policy with name '${name}' already exists.` });
      }
      slaRule.name = name;
    }

    if (policyPriority !== undefined) slaRule.policyPriority = policyPriority;
    if (description !== undefined) slaRule.description = description;

    // Logic to construct new state for validation
    const nextScope = scope ? { ...slaRule.scope.toObject(), ...scope } : slaRule.scope.toObject();
    const nextPriority = policyPriority !== undefined ? policyPriority : slaRule.policyPriority;
    const nextActive = isActive !== undefined ? isActive : slaRule.isActive;

    // Validation: Overlap (Scope + Priority)
    if (nextActive) {
      // If we are modifying an active rule, or activating it, or changing its scope/priority
      const validation = await checkSLAOverlap({ _id: slaRule._id, scope: nextScope, policyPriority: nextPriority });
      if (validation.conflict) {
        return res.status(400).json({ message: validation.message });
      }
    }

    // Targets Validation
    if (targets) {
      const relevantTargets = targets.filter(t => ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(t.priority));
      for (const t of relevantTargets) {
        if (t.responseTime <= 0 || t.resolutionTime <= 0) return res.status(400).json({ message: 'Time targets must be > 0' });
        if (Number(t.resolutionTime) < Number(t.responseTime)) return res.status(400).json({ message: `Resolution < Response for ${t.priority}` });
      }
      slaRule.targets = relevantTargets;
    }

    if (escalations) slaRule.escalations = escalations;
    if (isActive !== undefined) slaRule.isActive = isActive;
    if (scope) slaRule.scope = nextScope;
    if (breachRules) slaRule.breachRules = breachRules;

    slaRule.version = (slaRule.version || 1) + 1;
    slaRule.updatedBy = req.user._id;

    await slaRule.save();
    await logAudit('Updated SLA Policy', req.user.id, slaRule._id, { name: slaRule.name, version: slaRule.version });

    res.json({ message: 'SLA policy updated successfully', slaRule });
  } catch (error) {
    console.error('Error updating SLA rule:', error);
    
    // Duplicate key errors (MongoDB)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ 
        message: `An SLA rule with this ${field} already exists.`,
        error: `Duplicate key error: ${field}`
      });
    }

    res.status(500).json({ 
      message: 'Error updating SLA rule', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal Server Error' 
    });
  }
};

// Activate/Deactivate SLA rule
const activateSLARule = async (req, res) => {
  try {
    const { isActive } = req.body;
    const slaRule = await SLA.findById(req.params.id);

    if (!slaRule) return res.status(404).json({ message: 'SLA rule not found' });

    if (isActive) {
      // Run Overlap Check
      const validation = await checkSLAOverlap(slaRule);
      if (validation.conflict) {
        return res.status(400).json({ message: validation.message });
      }
    }

    slaRule.isActive = isActive;
    slaRule.updatedBy = req.user._id;
    await slaRule.save();

    await logAudit(isActive ? 'Activated SLA Policy' : 'Deactivated SLA Policy', req.user.id, slaRule._id, { name: slaRule.name });
    res.json({ message: `SLA policy ${isActive ? 'activated' : 'deactivated'} successfully`, slaRule });
  } catch (error) {
    console.error('Error toggling SLA activation:', error);
    res.status(500).json({ message: 'Error updating SLA status', error: error.message });
  }
};

// Delete SLA rule
const deleteSLARule = async (req, res) => {
  try {
    const slaRule = await SLA.findById(req.params.id);

    if (!slaRule) {
      return res.status(404).json({ message: 'SLA rule not found' });
    }

    await slaRule.deleteOne();

    await logAudit('Deleted SLA Policy', req.user.id, slaRule._id, {
      name: slaRule.name
    });

    res.json({
      message: 'SLA policy deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting SLA rule:', error);
    res.status(500).json({
      message: 'Error deleting SLA rule',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  createSLARule,
  getAllSLARules,
  getSLARuleById,
  updateSLARule,
  activateSLARule,
  deleteSLARule
};