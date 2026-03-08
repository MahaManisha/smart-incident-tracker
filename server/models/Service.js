const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    ownerTeam: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    },
    criticality: {
        type: String,
        enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
        default: "MEDIUM"
    },
    status: {
        type: String,
        enum: ["OPERATIONAL", "DEGRADED", "DOWN"],
        default: "OPERATIONAL"
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Service', serviceSchema);
