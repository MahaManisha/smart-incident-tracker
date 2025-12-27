const mongoose = require("mongoose");

const postmortemSchema = new mongoose.Schema(
  {
    incidentId: { type: mongoose.Schema.Types.ObjectId, ref: "Incident", required: true },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    rootCause: { type: String, required: true },
    preventiveActions: { type: String, required: true },
    reviewed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Postmortem", postmortemSchema);
