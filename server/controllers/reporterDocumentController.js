const Document = require('../models/Document');
const fs = require('fs');
const path = require('path');

// @desc    Get all documents for logged-in reporter
// @route   GET /api/reporter/documents
// @access  Private (REPORTER)
exports.getReporterDocuments = async (req, res, next) => {
    try {
        const query = req.query;
        let filter = {
            reporter_id: req.user._id,
            deleted_at: null // Filter out soft-deleted
        };

        // Allowed filters
        if (query.incident_id) {
            filter.incident_id = query.incident_id;
        }
        if (query.file_type) {
            filter.file_type = { $regex: new RegExp(query.file_type, 'i') };
        }
        if (query.search) {
            filter.$or = [
                { document_name: { $regex: query.search, $options: 'i' } }
            ];
            // If search is a valid ObjectId, we can search by incident_id
            if (query.search.match(/^[0-9a-fA-F]{24}$/)) {
                filter.$or.push({ incident_id: query.search });
            }
        }

        let docs = await Document.find(filter)
            .populate('incident_id', 'title incidentNumber') // populate minimal info
            .lean();

        // Also fetch from Documentation model (Knowledge Base attachments)
        const mongoose = require('mongoose');
        const Documentation = mongoose.model('Documentation');

        let docFilter = {
            submittedBy: req.user._id
        };
        if (query.incident_id) {
            docFilter.incidentId = query.incident_id;
        }

        const knowledgeDocs = await Documentation.find(docFilter).populate('incidentId', 'title incidentNumber').lean();

        let kbAttachments = [];
        for (const kDoc of knowledgeDocs) {
            if (kDoc.attachments && kDoc.attachments.length > 0) {
                for (let i = 0; i < kDoc.attachments.length; i++) {
                    const att = kDoc.attachments[i];

                    // Apply filters locally for attachments
                    if (query.search && !att.name.toLowerCase().includes(query.search.toLowerCase())) continue;
                    if (query.file_type && att.type && !att.type.toLowerCase().includes(query.file_type.toLowerCase())) continue;

                    // Map attachment to look like a standard Document
                    kbAttachments.push({
                        _id: `kb_${kDoc._id}_${i}`,
                        document_name: att.name,
                        description: `Attached via Post-Incident Documentation: ${kDoc.title}`,
                        incident_id: kDoc.incidentId,
                        file_path: att.path.startsWith('/') ? att.path : `/${att.path}`,
                        file_size: att.size || 0,
                        file_type: att.type || 'application/octet-stream',
                        created_at: kDoc.createdAt || new Date(),
                        updated_at: kDoc.updatedAt || new Date(),
                        deleted_at: null,
                        is_knowledge_base: true // Flag to disable edit/delete on frontend
                    });
                }
            }
        }

        // Combine and sort
        let allDocs = [...docs, ...kbAttachments];
        allDocs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        if (query.date) {
            const searchDate = new Date(query.date).toDateString();
            allDocs = allDocs.filter(doc => new Date(doc.created_at).toDateString() === searchDate);
        }

        res.status(200).json({
            success: true,
            count: allDocs.length,
            data: allDocs
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Upload new document
// @route   POST /api/reporter/documents
// @access  Private (REPORTER)
exports.uploadDocument = async (req, res, next) => {
    try {
        const { document_name, description, incident_id } = req.body;

        if (!document_name) {
            return res.status(400).json({ success: false, message: 'Document name is required' });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'File is required' });
        }

        const doc = await Document.create({
            reporter_id: req.user._id,
            incident_id: incident_id || null,
            document_name,
            description: description || '',
            file_path: `/uploads/${req.file.filename}`,
            file_size: req.file.size,
            file_type: req.file.mimetype
        });

        res.status(201).json({
            success: true,
            data: doc
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update document metadata or replace file
// @route   PUT /api/reporter/documents/:id
// @access  Private (REPORTER)
exports.updateDocument = async (req, res, next) => {
    try {
        let doc = await Document.findById(req.params.id);

        if (!doc) {
            return res.status(404).json({ success: false, message: 'Document not found' });
        }

        // Security check: Match reporter_id
        if (doc.reporter_id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to access this document' });
        }

        const { document_name, description, incident_id } = req.body;

        const updateData = {};
        if (document_name) updateData.document_name = document_name;
        if (description !== undefined) updateData.description = description;
        if (incident_id) updateData.incident_id = incident_id;

        // If file replaced
        if (req.file) {
            const oldFilePath = path.join(__dirname, '..', doc.file_path);
            if (fs.existsSync(oldFilePath)) {
                fs.unlinkSync(oldFilePath);
            }
            updateData.file_path = `/uploads/${req.file.filename}`;
            updateData.file_size = req.file.size;
            updateData.file_type = req.file.mimetype;
        }

        doc = await Document.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: doc
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Soft delete document
// @route   DELETE /api/reporter/documents/:id
// @access  Private (REPORTER)
exports.deleteDocument = async (req, res, next) => {
    try {
        const doc = await Document.findById(req.params.id);

        if (!doc) {
            return res.status(404).json({ success: false, message: 'Document not found' });
        }

        // Security check: Match reporter_id
        if (doc.reporter_id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this document' });
        }

        doc.deleted_at = new Date();
        await doc.save();

        res.status(200).json({
            success: true,
            message: 'Document deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};
