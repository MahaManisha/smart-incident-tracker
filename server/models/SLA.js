const mongoose = require("mongoose");

const slaSchema = new mongoose.Schema(
  {
    severity: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      required: true,
      unique: true
    },
    responseTimeHours: { type: Number, required: true }, // SLA hours to first response
    resolutionTimeHours: { type: Number, required: true }, // SLA hours to resolve
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Admin
  },
  { timestamps: true }
);

module.exports = mongoose.model("SLA", slaSchema);
