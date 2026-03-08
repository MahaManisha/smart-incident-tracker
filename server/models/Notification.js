const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    incident: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Incident",
    },
    type: {
      type: String,
      demonstrate: [
        "SLA_BREACH",
        "INCIDENT_ASSIGNED",
        "INCIDENT_UPDATED",
        "POSTMORTEM_REQUIRED",
        "SYSTEM",
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    metadata: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
