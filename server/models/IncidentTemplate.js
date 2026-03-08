const mongoose = require('mongoose');

const incidentTemplateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        index: true,
        unique: true
    },
    description: String,
    defaultTitle: {
        type: String,
        required: true
    },
    defaultIncidentDescription: String,
    defaultPriority: {
        type: String,
        enum: ["P0", "P1", "P2", "P3"],
        default: "P3"
    },
    defaultBusinessCriticality: {
        type: String,
        enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
        default: "LOW"
    },
    defaultTeam: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    },
    defaultAssignee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    defaultTags: [String],
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('IncidentTemplate', incidentTemplateSchema);
