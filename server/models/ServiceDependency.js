const mongoose = require('mongoose');

const serviceDependencySchema = new mongoose.Schema({
    sourceService: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service',
        required: true
    },
    dependentService: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service',
        required: true
    },
    dependencyType: {
        type: String,
        enum: ["HARD", "SOFT"],
        default: "HARD"
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// A service cannot depend on itself
serviceDependencySchema.pre('save', function (next) {
    if (this.sourceService.equals(this.dependentService)) {
        return next(new Error('A service cannot depend on itself'));
    }
    next();
});

module.exports = mongoose.model('ServiceDependency', serviceDependencySchema);
