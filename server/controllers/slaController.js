const SLA = require('../models/SLA');
const { getSLAComplianceMetrics } = require('../services/slaService');
const { logAudit } = require('../middleware/auditLogger');

// Create SLA rule
const createSLARule = async (req, res) => {
  try {
    const { severity, responseTimeHours, resolutionTimeHours } = req.body;
    
    // Check if rule already exists for this severity
    const existingRule = await SLA.findOne({ severity });
    
    if (existingRule) {
      return res.status(400).json({ 
        message: `SLA rule already exists for ${severity} severity. Use update endpoint.` 
      });
    }
    
    const slaRule = await SLA.create({
      severity,
      responseTimeHours,
      resolutionTimeHours
    });
    
    // Log audit
    await logAudit('Created SLA Rule', req.user.id, slaRule._id, { severity });
    
    res.status(201).json({
      message: 'SLA rule created successfully',
      slaRule
    });
  } catch (error) {
    console.error('Error creating SLA rule:', error);
    res.status(500).json({ 
      message: 'Error creating SLA rule', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

// Get all SLA rules
const getAllSLARules = async (req, res) => {
  try {
    const slaRules = await SLA.find().sort({ severity: 1 });
    
    res.json({
      slaRules
    });
  } catch (error) {
    console.error('Error fetching SLA rules:', error);
    res.status(500).json({ 
      message: 'Error fetching SLA rules', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

// Get SLA rule by ID
const getSLARuleById = async (req, res) => {
  try {
    const slaRule = await SLA.findById(req.params.id);
    
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
    const { responseTimeHours, resolutionTimeHours } = req.body;
    
    const slaRule = await SLA.findById(req.params.id);
    
    if (!slaRule) {
      return res.status(404).json({ message: 'SLA rule not found' });
    }
    
    if (responseTimeHours !== undefined) {
      slaRule.responseTimeHours = responseTimeHours;
    }
    
    if (resolutionTimeHours !== undefined) {
      slaRule.resolutionTimeHours = resolutionTimeHours;
    }
    
    await slaRule.save();
    
    // Log audit
    await logAudit('Updated SLA Rule', req.user.id, slaRule._id, {
      severity: slaRule.severity
    });
    
    res.json({
      message: 'SLA rule updated successfully',
      slaRule
    });
  } catch (error) {
    console.error('Error updating SLA rule:', error);
    res.status(500).json({ 
      message: 'Error updating SLA rule', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
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
    
    // Log audit
    await logAudit('Deleted SLA Rule', req.user.id, slaRule._id, {
      severity: slaRule.severity
    });
    
    res.json({
      message: 'SLA rule deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting SLA rule:', error);
    res.status(500).json({ 
      message: 'Error deleting SLA rule', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

// Get SLA compliance report
const getSLACompliance = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default 30 days ago
    const end = endDate ? new Date(endDate) : new Date();
    
    const complianceMetrics = await getSLAComplianceMetrics(start, end);
    
    res.json({
      period: {
        startDate: start,
        endDate: end
      },
      metrics: complianceMetrics
    });
  } catch (error) {
    console.error('Error fetching SLA compliance:', error);
    res.status(500).json({ 
      message: 'Error fetching SLA compliance', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

module.exports = {
  createSLARule,
  getAllSLARules,
  getSLARuleById,
  updateSLARule,
  deleteSLARule,
  getSLACompliance
};