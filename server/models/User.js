const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true }, // removed unique constraint
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["ADMIN", "RESPONDER", "REPORTER"],
      required: true,
    },
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: "Team", default: null },
    isActive: { type: Boolean, default: true }, // soft delete flag
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
