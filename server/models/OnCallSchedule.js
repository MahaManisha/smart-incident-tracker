const mongoose = require('mongoose');

const onCallScheduleSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    },
    startTime: {
        type: Date,
        required: true,
        index: true
    },
    endTime: {
        type: Date,
        required: true,
        index: true
    },
    shiftType: {
        type: String,
        enum: ['PRIMARY', 'SECONDARY'],
        default: 'PRIMARY'
    },
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

// Helper to check for overlapping shifts (can be used in controller or pre-save)
onCallScheduleSchema.index({ startTime: 1, endTime: 1 });

module.exports = mongoose.model('OnCallSchedule', onCallScheduleSchema);
