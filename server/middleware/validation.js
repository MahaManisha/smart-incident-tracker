const { body, param, query, validationResult } = require('express-validator');

// Validation result checker with detailed error logging
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error('Validation Errors:', JSON.stringify(errors.array(), null, 2));
    console.error('Request Body:', JSON.stringify(req.body, null, 2));
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Incident validations - SIMPLIFIED VERSION
const incidentValidation = {
  create: [
    body('title')
      .notEmpty().withMessage('Title is required')
      .isLength({ max: 200 }).withMessage('Title must be less than 200 characters')
      .trim(),
    body('description')
      .notEmpty().withMessage('Description is required')
      .trim(),
    body('severity')
      .isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
      .withMessage('Invalid severity level'),
    body('affectedService')
      .optional()
      .trim(),
    body('impactedUsers')
      .optional()
      .isInt({ min: 0 }).withMessage('Impacted users must be a positive number')
    // REMOVED ALL .not().exists() CHECKS - They were too strict
  ],

  update: [
    body('title')
      .optional()
      .isLength({ max: 200 }).withMessage('Title must be less than 200 characters')
      .trim(),
    body('description')
      .optional()
      .trim(),
    body('severity')
      .optional()
      .isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
      .withMessage('Invalid severity level')
  ],

  updateStatus: [
    body('status')
      .isIn(['OPEN', 'ASSIGNED', 'INVESTIGATING', 'RESOLVED', 'CLOSED', 'REOPENED'])
      .withMessage('Invalid status'),
    body('notes')
      .optional()
      .trim()
  ],

  assign: [
    body('responderId')
      .notEmpty().withMessage('Responder ID is required')
      .isMongoId().withMessage('Invalid responder ID')
  ],

  addComment: [
    body('comment')
      .notEmpty().withMessage('Comment is required')
      .trim(),
    body('isInternal')
      .optional()
      .isBoolean().withMessage('isInternal must be a boolean')
  ],

  close: [
    body('resolutionNotes')
      .notEmpty().withMessage('Resolution notes are required')
      .trim(),
    body('rootCause')
      .optional()
      .trim()
  ],

  reopen: [
    body('reason')
      .notEmpty().withMessage('Reason is required')
      .trim()
  ],

  escalate: [
    body('escalatedTo')
      .notEmpty().withMessage('Escalated to user ID is required')
      .isMongoId().withMessage('Invalid user ID'),
    body('reason')
      .notEmpty().withMessage('Escalation reason is required')
      .trim()
  ]
};

// SLA validations
const slaValidation = {
  create: [
    body('name')
      .notEmpty().withMessage('SLA Name is required')
      .trim()
      .isLength({ min: 3, max: 100 }).withMessage('Name must be between 3 and 100 characters'),

    body('description').optional().trim(),

    body('scope.incidentType').optional().trim(),
    body('scope.service').optional().trim(),
    body('scope.department').optional().trim(),
    body('scope.timezone').optional().trim(),

    body('targets')
      .isArray({ min: 1 }).withMessage('At least one target is required')
      .custom((targets) => {
        const priorities = new Set();
        for (const target of targets) {
          if (!['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(target.priority)) {
            throw new Error(`Invalid priority: ${target.priority}`);
          }
          if (priorities.has(target.priority)) {
            throw new Error(`Duplicate priority target: ${target.priority}`);
          }
          priorities.add(target.priority);

          if (!target.responseTime || target.responseTime < 1) {
            throw new Error('Response time must be at least 1 minute');
          }
          if (!target.resolutionTime || target.resolutionTime < 1) {
            throw new Error('Resolution time must be at least 1 minute');
          }
          if (target.resolutionTime <= target.responseTime) {
            throw new Error('Resolution time must be greater than response time');
          }
        }
        return true;
      }),

    body('escalations')
      .optional()
      .isArray()
      .custom((escalations) => {
        if (!escalations) return true;
        const levels = new Set();
        for (const esc of escalations) {
          if (levels.has(esc.level)) {
            throw new Error(`Duplicate escalation level: ${esc.level}`);
          }
          levels.add(esc.level);

          // Allowed trigger types and actions
          // Note: Frontend sends triggerPercentage (number), schema expects triggerPercentage.
          // Is triggerType relevant? Schema doesn't have triggerType. It has triggerPercentage.
          // Validation checks triggerType? 
          // Schema escalationSchema: level, triggerPercentage, notifyRoles, notifyUsers, action.
          // My Form sends action and triggerPercentage.
          // Validation checks: if (!['RESPONSE', 'RESOLUTION'].includes(esc.triggerType))
          // My Schema DOES NOT HAVE triggerType. It has triggerPercentage.
          // I should remove the triggerType check or align if it was intended. 
          // For now, I will remove strict enum checks that don't match or update them.
          // Actually, I'll remove triggerType check as it's not in Schema provided earlier.

          if (!['NOTIFY', 'REASSIGN', 'CHANGE_PRIORITY'].includes(esc.action)) {
            // Checking against schema enum: ["NOTIFY", "REASSIGN", "CHANGE_PRIORITY"]
            // Validation was checking: ['NOTIFY_MANAGER', 'NOTIFY_ADMIN', 'REASSIGN_TEAM', 'CHANGE_PRIORITY']
            // I will align to schema: NOTIFY, REASSIGN, CHANGE_PRIORITY.
            throw new Error('Invalid escalation action');
          }
        }
        return true;
      }),

    body('breachRules')
      .optional()
      .isObject()
  ],

  update: [
    body('name').optional().trim().isLength({ min: 3 }),
    body('targets').optional().isArray(),
    body('escalations').optional().isArray()
  ]
};

// Team validations
const teamValidation = {
  create: [
    body('name')
      .notEmpty().withMessage('Team name is required')
      .trim(),
    body('members')
      .optional()
      .isArray().withMessage('Members must be an array')
  ],

  update: [
    body('name')
      .optional()
      .trim(),
    body('members')
      .optional()
      .isArray().withMessage('Members must be an array'),
    body('isActive')
      .optional()
      .isBoolean().withMessage('isActive must be a boolean')
  ],

  addMember: [
    body('userId')
      .notEmpty().withMessage('User ID is required')
      .isMongoId().withMessage('Invalid user ID')
  ]
};

// User validations
const userValidation = {
  create: [
    body('name')
      .notEmpty().withMessage('Name is required')
      .trim(),
    body('email')
      .isEmail().withMessage('Valid email is required')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role')
      .isIn(['ADMIN', 'RESPONDER', 'REPORTER'])
      .withMessage('Invalid role'),
    body('teamId')
      .optional()
      .isMongoId().withMessage('Invalid team ID')
  ],

  update: [
    body('name')
      .optional()
      .trim(),
    body('email')
      .optional()
      .isEmail().withMessage('Valid email is required')
      .normalizeEmail(),
    body('role')
      .optional()
      .isIn(['ADMIN', 'RESPONDER', 'REPORTER'])
      .withMessage('Invalid role'),
    body('teamId')
      .optional()
      .isMongoId().withMessage('Invalid team ID'),
    body('isActive')
      .optional()
      .isBoolean().withMessage('isActive must be a boolean')
  ],

  updateProfile: [
    body('name')
      .optional()
      .trim(),
    body('profileImage')
      .optional()
      .trim(),
    body('phoneNumber')
      .optional()
      .trim(),
    body('notificationPreferences')
      .optional(),
    body('isAway')
      .optional(),
    body('awayRouteTo')
      .optional()
      .custom((value) => {
        // Must require mongoose
        const mongoose = require('mongoose');
        if (value && !mongoose.Types.ObjectId.isValid(value)) {
          throw new Error('Invalid user ID for re-routing');
        }
        return true;
      })
  ],

  changePassword: [
    body('currentPassword')
      .notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
      .custom((value, { req }) => {
        if (value === req.body.currentPassword) {
          throw new Error('New password must be different from current password');
        }
        return true;
      })
  ]
};

// Postmortem validations
const postmortemValidation = {
  create: [
    body('incidentId')
      .notEmpty().withMessage('Incident ID is required')
      .isMongoId().withMessage('Invalid incident ID'),
    body('rootCause')
      .notEmpty().withMessage('Root cause is required')
      .trim(),
    body('preventiveActions')
      .notEmpty().withMessage('Preventive actions are required')
      .isArray().withMessage('Preventive actions must be an array')
  ],

  update: [
    body('rootCause')
      .optional()
      .trim(),
    body('preventiveActions')
      .optional()
      .isArray().withMessage('Preventive actions must be an array')
  ]
};

// Query parameter validations
const queryValidation = {
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
  ],

  dateRange: [
    query('startDate')
      .optional()
      .isISO8601().withMessage('Invalid start date format'),
    query('endDate')
      .optional()
      .isISO8601().withMessage('Invalid end date format')
  ]
};

// Parameter validations
const paramValidation = {
  mongoId: [
    param('id')
      .isMongoId().withMessage('Invalid ID format')
  ]
};

module.exports = {
  validate,
  incidentValidation,
  slaValidation,
  teamValidation,
  userValidation,
  postmortemValidation,
  queryValidation,
  paramValidation
};