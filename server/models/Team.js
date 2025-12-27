const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Users in this team
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Admin who created
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Team", teamSchema);
