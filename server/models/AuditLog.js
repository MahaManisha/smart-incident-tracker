const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true }, // e.g., "INCIDENT_CREATED", "STATUS_CHANGED"
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    incident: { type: mongoose.Schema.Types.ObjectId, ref: "Incident" }, // Explicit link for timeline
    target: { type: String, required: true }, // General target identifier (fallback)
    timestamp: { type: Date, default: Date.now },
    details: { type: mongoose.Schema.Types.Mixed } // Stores description, old/new values, etc.
  },
  { timestamps: true }
);

module.exports = mongoose.model("AuditLog", auditLogSchema);
