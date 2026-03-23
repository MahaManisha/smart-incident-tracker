const mongoose = require('mongoose');

const escalationLevelSchema = new mongoose.Schema({
    levelNumber: {
        type: Number,
        required: true
    },
    escalateAfterMinutes: {
        type: Number,
        required: true
    },
    escalateToRole: {
        type: String,
        enum: ['REPORTER', 'RESPONDER', 'ADMIN'], // Matching user roles
        default: 'RESPONDER'
    },
    escalateToUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    escalateToTeam: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    }
});

const conditionSchema = new mongoose.Schema({
    field: { type: String, required: true },
    operator: { type: String, required: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true }
}, { _id: false });

const escalationPolicySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: { type: String },
    conditions: [conditionSchema],
    routingLogic: { type: String, enum: ['ALL', 'ANY', 'CUSTOM'], default: 'ALL' },
    levels: [escalationLevelSchema],
    isDefault: {
        type: Boolean,
        default: false
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Ensure only one default policy exists
escalationPolicySchema.pre('save', async function (next) {
    if (this.isDefault) {
        await this.constructor.updateMany(
            { _id: { $ne: this._id } },
            { $set: { isDefault: false } }
        );
    }
    next();
});

module.exports = mongoose.model('EscalationPolicy', escalationPolicySchema);
