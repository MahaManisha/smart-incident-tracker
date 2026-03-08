const mongoose = require("mongoose");

const attachmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    path: {
        type: String,
        required: true
    },
    type: {
        type: String, // 'application/pdf', 'image/png', etc.
        required: false
    },
    size: {
        type: Number,
        required: false
    }
}, { _id: false }); // No ID needed for subdocs if not referenced individually

const documentationSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200
        },
        incidentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Incident",
            required: true // strict linkage
        },
        submittedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        description: {
            type: String, // Kept for backwards compatibility or generic summary
            required: false
        },
        rootCause: {
            type: String,
            required: false
        },
        resolutionSteps: {
            type: String,
            required: false
        },
        preventiveSteps: {
            type: String,
            required: false
        },
        attachments: {
            type: [attachmentSchema],
            default: []
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Documentation", documentationSchema);
