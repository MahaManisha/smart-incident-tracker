const mongoose = require("mongoose");

const incidentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      required: true,
      trim: true
    },

    severity: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      required: true
    },

    priority: {
      type: String,
      enum: ["P0", "P1", "P2", "P3"],
      default: "P3",
      index: true
    },

    severityScore: {
      type: Number,
      default: 0
    },

    businessCriticality: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      default: "LOW"
    },

    priorityManuallyOverridden: {
      type: Boolean,
      default: false
    },

    type: {
      type: String,
      enum: ["SECURITY", "NETWORK", "HARDWARE", "SOFTWARE", "OTHER"],
      default: 'OTHER'
    },
    // Escalation fields
    escalationPolicy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EscalationPolicy'
    },
    escalationLevel: {
      type: Number,
      default: 1
    },
    escalationStartedAt: {
      type: Date
    },
    lastEscalatedAt: {
      type: Date
    },
    nextEscalationAt: {
      type: Date
    },
    escalationStatus: {
      type: String,
      enum: ['ACTIVE', 'ESCALATED', 'COMPLETED'],
      default: 'ACTIVE'
    },
    isEscalated: { // Redundant but helpful for quick queries
      type: Boolean,
      default: false
    },

    status: {
      type: String,
      enum: ["OPEN", "ASSIGNED", "INVESTIGATING", "RESOLVED", "CLOSED"],
      default: "OPEN"
    },

    // User who CREATED the incident (admin / reporter / responder)
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true  // ✅ NOW REQUIRED - MUST BE POPULATED
    },

    reportedByRole: {
      type: String,
      enum: ["ADMIN", "REPORTER", "RESPONDER"],
      required: true
    },

    // User who is HANDLING the incident
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    // Team which is HANDLING the incident
    assignedTeam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      default: null
    },

    assignedAt: {
      type: Date,
      default: null
    },

    // SLA Tracking Fields
    slaPolicy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SLA",
      default: null
    },

    slaStatus: {
      type: String,
      enum: ["PENDING", "MET", "BREACHED"], // Overall status
      default: "PENDING"
    },

    slaResponseDeadline: { type: Date, default: null },
    slaResolutionDeadline: { type: Date, default: null },

    slaResponseStatus: {
      type: String,
      enum: ["PENDING", "MET", "BREACHED", "N/A"],
      default: "PENDING"
    },

    slaResolutionStatus: {
      type: String,
      enum: ["PENDING", "MET", "BREACHED"],
      default: "PENDING"
    },

    slaBreachLog: [{
      type: { type: String, enum: ["RESPONSE", "RESOLUTION"] },
      breachedAt: { type: Date, default: Date.now },
      timeOverdueMs: Number
    }],

    resolvedAt: {
      type: Date,
      default: null
    },

    affectedService: {
      type: String,
      trim: true,
      default: null
    },

    impactedUsers: {
      type: Number,
      default: null
    },

    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      default: null
    },

    impactedServices: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service'
    }],

    // Embedded comments array
    comments: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true
        },
        userName: {
          type: String,
          required: true
        },
        userRole: {
          type: String,
          enum: ["ADMIN", "REPORTER", "RESPONDER"],
          required: true
        },
        comment: {
          type: String,
          required: true,
          trim: true
        },
        isInternal: {
          type: Boolean,
          default: false
        },
        createdAt: {
          type: Date,
          default: Date.now
        }
      }
    ]
  },
  {
    timestamps: true
  }
);

// Virtual for incident number (using _id)
incidentSchema.virtual('incidentNumber').get(function () {
  return `INC-${this._id.toString().slice(-8).toUpperCase()}`;
});

// Virtual for reporter (alias for reportedBy for frontend compatibility)
incidentSchema.virtual('reporter', {
  ref: 'User',
  localField: 'reportedBy',
  foreignField: '_id',
  justOne: true
});

// Virtual for responder (alias for assignedTo for frontend compatibility)
incidentSchema.virtual('responder', {
  ref: 'User',
  localField: 'assignedTo',
  foreignField: '_id',
  justOne: true
});

// Virtual for slaDeadline (alias for slaDue for frontend compatibility)
incidentSchema.virtual('slaDeadline').get(function () {
  return this.slaResolutionDeadline;
});

// Ensure virtuals are included when converting to JSON
incidentSchema.set('toJSON', { virtuals: true });
incidentSchema.set('toObject', { virtuals: true });

// Index for faster queries
incidentSchema.index({ reportedBy: 1 });
incidentSchema.index({ assignedTo: 1 });
incidentSchema.index({ assignedTeam: 1 });
incidentSchema.index({ status: 1 });
incidentSchema.index({ severity: 1 });
incidentSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Incident", incidentSchema);