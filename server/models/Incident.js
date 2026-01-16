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

    status: {
      type: String,
      enum: ["OPEN", "INVESTIGATING", "RESOLVED"],
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

    // SLA calculated by system, not user
    slaDue: {
      type: Date,
      default: null
    },

    reportedAt: {
      type: Date,
      default: Date.now
    },

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
incidentSchema.virtual('incidentNumber').get(function() {
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
incidentSchema.virtual('slaDeadline').get(function() {
  return this.slaDue;
});

// Ensure virtuals are included when converting to JSON
incidentSchema.set('toJSON', { virtuals: true });
incidentSchema.set('toObject', { virtuals: true });

// Index for faster queries
incidentSchema.index({ reportedBy: 1 });
incidentSchema.index({ assignedTo: 1 });
incidentSchema.index({ status: 1 });
incidentSchema.index({ severity: 1 });
incidentSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Incident", incidentSchema);