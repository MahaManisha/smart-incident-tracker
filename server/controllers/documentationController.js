const Documentation = require('../models/Documentation');
const fs = require('fs'); // For file deletion if needed later

// @desc    Create new documentation
// @route   POST /api/documentation
// @access  Private (Responder, Admin)
exports.createDocumentation = async (req, res) => {
    try {
        const { title, incidentId, description, rootCause, resolutionSteps, preventiveSteps } = req.body;

        if (!incidentId) {
            return res.status(400).json({
                success: false,
                message: 'Documentation must be linked to an incident.'
            });
        }

        // Process uploaded files
        const attachments = req.files ? req.files.map(file => ({
            name: file.originalname,
            path: file.path,
            type: file.mimetype,
            size: file.size
        })) : [];

        const documentation = await Documentation.create({
            title,
            description: description || resolutionSteps, // Fallback
            rootCause,
            resolutionSteps,
            preventiveSteps,
            incidentId: incidentId,
            submittedBy: req.user._id,
            attachments
        });

        res.status(201).json({
            success: true,
            data: documentation
        });
    } catch (error) {
        console.error('Error creating documentation:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// @desc    Get all documentation
// @route   GET /api/documentation
// @access  Private (Responder, Admin)
exports.getAllDocumentation = async (req, res) => {
    try {
        const docs = await Documentation.find()
            .populate('submittedBy', 'name email')
            .populate('incidentId', 'title incidentNumber')
            .sort('-createdAt');

        res.status(200).json({
            success: true,
            count: docs.length,
            data: docs
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// @desc    Get single documentation
// @route   GET /api/documentation/:id
// @access  Private (Responder, Admin)
exports.getDocumentationById = async (req, res) => {
    try {
        const doc = await Documentation.findById(req.params.id)
            .populate('submittedBy', 'name email')
            .populate('incidentId', 'title incidentNumber');

        if (!doc) {
            return res.status(404).json({
                success: false,
                message: 'Documentation not found'
            });
        }

        res.status(200).json({
            success: true,
            data: doc
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};
// @desc    Get single documentation by Incident ID
// @route   GET /api/incidents/:incidentId/documentation
// @access  Private (Responder, Admin)
exports.getDocumentationByIncidentId = async (req, res) => {
    try {
        const doc = await Documentation.findOne({ incidentId: req.params.incidentId })
            .populate('submittedBy', 'name email')
            .populate('incidentId', 'title incidentNumber');

        if (!doc) {
            return res.status(404).json({
                success: false,
                message: 'Documentation not found for this incident'
            });
        }

        res.status(200).json({
            success: true,
            data: doc
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// @desc    Update documentation
// @route   PUT /api/incidents/:incidentId/documentation
// @access  Private (Original Author or Admin)
exports.updateDocumentation = async (req, res) => {
    try {
        console.log(`[UPDATE DOC] Request for incident: ${req.params.incidentId}`);
        const incidentId = req.params.incidentId;

        let doc = await Documentation.findOne({ incidentId: incidentId });

        // Handle case where doc not found
        if (!doc) {
            console.log(`[UPDATE DOC] Documentation not found for incident: ${incidentId}`);
            return res.status(404).json({
                success: false,
                message: 'Documentation not found'
            });
        }

        // Check ownership (Admin or Original Submitter)
        const submitterId = doc.submittedBy ? doc.submittedBy.toString() : '';
        const currentUserId = req.user ? (req.user._id ? req.user._id.toString() : req.user.id) : '';

        console.log(`[UPDATE DOC] Checking auth: Submitter=${submitterId}, Current=${currentUserId}, Role=${req.user ? req.user.role : 'UNKNOWN'}`);

        if (submitterId && submitterId !== currentUserId && req.user.role !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to edit this documentation'
            });
        }

        const { title, description, rootCause, resolutionSteps, preventiveSteps, removedFiles } = req.body;

        // Prepare Update Object
        const updateData = {};
        if (title) updateData.title = title;
        if (description) updateData.description = description;
        if (rootCause) updateData.rootCause = rootCause;
        if (resolutionSteps) updateData.resolutionSteps = resolutionSteps;
        if (preventiveSteps) updateData.preventiveSteps = preventiveSteps;

        // Handle Attachments
        // 1. Get current attachments as Plain JS Objects (to safely modify)
        let currentAttachments = doc.attachments ? doc.attachments.map(a => {
            // Normalize Mongoose subdoc to POJO
            return a.toObject ? a.toObject() : a;
        }) : [];

        // 2. Remove files
        if (removedFiles) {
            try {
                let filesToRemove = removedFiles;
                // Normalize Input: if string, parse it.
                if (typeof filesToRemove === 'string') {
                    filesToRemove = JSON.parse(filesToRemove);
                }

                // Normalize Array: Ensure it's an array of STRINGS (filenames)
                // Start with empty
                let fileNamesToRemove = [];

                if (Array.isArray(filesToRemove)) {
                    // Check if it's array of objects or strings
                    filesToRemove.forEach(item => {
                        if (typeof item === 'string') fileNamesToRemove.push(item);
                        else if (typeof item === 'object' && item.name) fileNamesToRemove.push(item.name);
                    });

                    console.log(`[UPDATE DOC] Eliminating files: ${fileNamesToRemove.join(', ')}`);
                    // Filter: Keep file if its NAME is NOT in fileNamesToRemove
                    currentAttachments = currentAttachments.filter(att => !fileNamesToRemove.includes(att.name));
                }
            } catch (e) {
                console.error('[UPDATE DOC] Error parsing removedFiles:', e);
            }
        }

        // 3. Add new files
        if (req.files && req.files.length > 0) {
            console.log(`[UPDATE DOC] Adding ${req.files.length} new files`);
            const newAttachments = req.files.map(file => ({
                name: file.originalname,
                path: file.path,
                type: file.mimetype,
                size: file.size
            }));
            currentAttachments = [...currentAttachments, ...newAttachments];
        }

        // 4. Assign complete array to update object
        updateData.attachments = currentAttachments;

        // Use findByIdAndUpdate for atomic write
        const updatedDoc = await Documentation.findByIdAndUpdate(
            doc._id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        console.log('[UPDATE DOC] Successfully updated documentation');

        res.status(200).json({
            success: true,
            data: updatedDoc
        });
    } catch (error) {
        console.error('[UPDATE DOC] Server Error:', error);
        res.status(500).json({
            success: false,
            message: `Update Failed: ${error.message}`,
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};
