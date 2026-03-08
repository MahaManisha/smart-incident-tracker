const express = require('express');
const router = express.Router();
const {
    getReporterDocuments,
    uploadDocument,
    updateDocument,
    deleteDocument
} = require('../controllers/reporterDocumentController');
const documentUpload = require('../middleware/documentUpload');
const { authenticate, authorize } = require('../middleware/auth');

// Apply protection and enforce REPORTER role (and ADMIN/RESPONDER for backup/testing)
router.use(authenticate);
router.use(authorize('REPORTER', 'RESPONDER', 'ADMIN'));

router
    .route('/')
    .get(getReporterDocuments)
    .post(documentUpload.single('file'), uploadDocument);

router
    .route('/:id')
    .put(documentUpload.single('file'), updateDocument)
    .delete(deleteDocument);

module.exports = router;
