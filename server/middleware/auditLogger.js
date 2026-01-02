const AuditLog = require('../models/AuditLog');

// Log audit action
const logAudit = async (action, performedBy, target, details) => {
  try {
    await AuditLog.create({
      action,
      performedBy,
      target: target || 'N/A',
      details: details || {}
    });
  } catch (error) {
    console.error('Audit log error:', error.message);
    // Don't throw error - audit logging should not break the main flow
  }
};

// Middleware to automatically log API calls
const auditMiddleware = (action) => {
  return async (req, res, next) => {
    // Store original json method
    const originalJson = res.json;
    
    // Override json method
    res.json = function(data) {
      // Log if successful (status < 400)
      if (res.statusCode < 400) {
        logAudit(
          action,
          req.user?.id || req.user?._id,
          req.params.id || req.body?.incidentId || 'N/A',
          {
            method: req.method,
            url: req.originalUrl,
            ip: req.ip,
            userAgent: req.get('user-agent')
          }
        ).catch(err => console.error('Audit logging failed:', err));
      }
      
      // Call original json method
      originalJson.call(this, data);
    };
    
    next();
  };
};

module.exports = {
  logAudit,
  auditMiddleware
};