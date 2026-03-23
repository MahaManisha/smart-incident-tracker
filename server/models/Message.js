const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
    {
        team: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Team",
            required: true,
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        content: {
            type: String,
            required: false, // Make it false because a message can just be an image
            trim: true,
        },
        replyTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
            default: null,
        },
        image: {
            type: String, // Base64 data URL or regular URL
            default: null,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);
