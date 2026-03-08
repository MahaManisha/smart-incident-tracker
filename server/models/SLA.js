const mongoose = require("mongoose");

const escalationSchema = new mongoose.Schema({
  level: { type: Number, required: true },
  triggerPercentage: { type: Number, required: true }, // % of SLA time elapsed
  notifyRoles: [{ type: String, enum: ["ADMIN", "RESPONDER", "MANAGER"] }],
  notifyUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  action: {
    type: String,
    enum: ["NOTIFY", "REASSIGN", "CHANGE_PRIORITY"],
    default: "NOTIFY"
  }
}, { _id: false });

const targetSchema = new mongoose.Schema({
  priority: {
    type: String,
    enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
    required: true
  },
  responseTime: { type: Number, required: true }, // Minutes
  resolutionTime: { type: Number, required: true }, // Minutes
  businessHours: { type: Boolean, default: false }
}, { _id: false });

const slaSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, trim: true },
    version: { type: Number, default: 1 },
    isActive: { type: Boolean, default: true },

    // Priority for conflict resolution (lower number = higher priority)
    policyPriority: { type: Number, default: 99 },

    // Scope
    scope: {
      incidentType: [{ type: String }], // Changed to Array. If empty or contains "ALL", applies to all
      priority: [{ type: String }],     // Changed to Array
      service: [{ type: String }],      // Changed to Array
      department: [{ type: String }],   // New
      team: [{ type: String }],         // New
      timezone: { type: String, default: "UTC" }
    },

    // Targets
    targets: [targetSchema],

    // Escalation Rules
    escalations: [escalationSchema],

    // Breach Handling
    breachRules: {
      autoActions: [{ type: String }], // e.g., ["NOTIFY_ADMIN", "TAG_BREACH"]
      allowOverride: { type: Boolean, default: false }
    },

    // Audit
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("SLA", slaSchema);
