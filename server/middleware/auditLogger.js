const AuditLog = require('../models/AuditLog');

// Log audit action (never block main flow)
const logAudit = async (action, performedBy, target, details = {}) => {
  try {
    const mongoose = require('mongoose');
    const auditData = {
      action,
      performedBy: performedBy || null,
      target: String(target) || 'N/A',
      details
    };

    // If target looks like a MongoDB ID, we also store it in the 'incident' field
    // or if incidentId is explicitly passed in details
    if (mongoose.Types.ObjectId.isValid(target)) {
      auditData.incident = target;
    } else if (details.incidentId && mongoose.Types.ObjectId.isValid(details.incidentId)) {
      auditData.incident = details.incidentId;
    }

    await AuditLog.create(auditData);
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
};

// Middleware factory
const auditMiddleware = (action) => {
  if (!action) {
    throw new Error('auditMiddleware requires an action string');
  }

  return (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = async (data) => {
      if (res.statusCode < 400) {
        await logAudit(
          action,
          req.user?.id || req.user?._id || null,
          req.params?.id || req.body?.incidentId || 'N/A',
          {
            method: req.method,
            url: req.originalUrl,
            ip: req.ip,
            userAgent: req.get('user-agent')
          }
        );
      }

      return originalJson(data);
    };

    next();
  };
};

module.exports = {
  logAudit,
  auditMiddleware
};
