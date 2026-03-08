const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
    {
        reporter_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        incident_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Incident',
            required: false
        },
        document_name: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
            trim: true,
            default: ''
        },
        file_path: {
            type: String,
            required: true
        },
        file_size: {
            type: Number,
            required: true
        },
        file_type: {
            type: String,
            required: true
        },
        deleted_at: {
            type: Date,
            default: null
        }
    },
    { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

module.exports = mongoose.model('Document', documentSchema);
