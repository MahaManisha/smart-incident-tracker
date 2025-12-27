const mongoose = require("mongoose");

const incidentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  severity: { type: String, enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"], required: true },
  status: { type: String, enum: ["OPEN", "INVESTIGATING", "RESOLVED"], default: "OPEN" },
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  responder: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: "Team", default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  slaDue: { type: Date, required: true }
});

// Optional: auto-update updatedAt
incidentSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Incident", incidentSchema);
