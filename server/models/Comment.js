const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    incidentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Incident',
      required: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    comment: {
      type: String,
      required: true,
      trim: true
    },
    isInternal: {
      type: Boolean,
      default: false
    }
  },
  { 
    timestamps: true // Adds createdAt and updatedAt
  }
);

// Index for faster queries
commentSchema.index({ incidentId: 1, createdAt: -1 });

module.exports = mongoose.model('Comment', commentSchema);