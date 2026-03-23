const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true }, // removed unique constraint
    phoneNumber: { type: String, default: "" }, // Optional phone number
    password: { type: String, required: true },
    profileImage: {
      type: String,
      default: '' // URL or path to image
    },
    validTokensAfter: {
      type: Date,
      default: null
    },
    role: {
      type: String,
      enum: ["ADMIN", "RESPONDER", "REPORTER"],
      required: true,
    },
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: "Team", default: null },
    isActive: { type: Boolean, default: true }, // soft delete flag
    
    // Industrial Upgrade: Granular Notification Preferences & Routing
    notificationPreferences: {
      emailThreshold: { type: String, enum: ['ALL', 'P3_AND_ABOVE', 'P2_AND_ABOVE', 'P1_AND_ABOVE', 'P0_ONLY', 'NONE'], default: 'ALL' },
      smsThreshold: { type: String, enum: ['ALL', 'P3_AND_ABOVE', 'P2_AND_ABOVE', 'P1_AND_ABOVE', 'P0_ONLY', 'NONE'], default: 'P0_ONLY' },
      pushThreshold: { type: String, enum: ['ALL', 'P3_AND_ABOVE', 'P2_AND_ABOVE', 'P1_AND_ABOVE', 'P0_ONLY', 'NONE'], default: 'P1_AND_ABOVE' },
    },
    isAway: { type: Boolean, default: false },
    awayRouteTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }
  },
  { timestamps: true }
);

// Optional: helper method to check if email is taken by an active user
userSchema.statics.isEmailTaken = async function (email, excludeUserId = null) {
  const query = { email, isActive: true };
  if (excludeUserId) query._id = { $ne: excludeUserId };
  const user = await this.findOne(query);
  return !!user;
};

module.exports = mongoose.model("User", userSchema);
