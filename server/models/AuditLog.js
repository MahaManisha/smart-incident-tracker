const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true }, // e.g., "Created Incident", "Updated Status"
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    target: { type: String, required: true }, // e.g., Incident ID, User ID
    timestamp: { type: Date, default: Date.now },
    details: { type: String } // optional additional info
  },
  { timestamps: true }
);

module.exports = mongoose.model("AuditLog", auditLogSchema);
