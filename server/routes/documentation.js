const express = require('express');
const router = express.Router();
const { verifyToken, authorize } = require('../middleware/auth');
const upload = require('../middleware/documentUpload');
const {
    createDocumentation,
    getAllDocumentation,
    getDocumentationById
} = require('../controllers/documentationController');

// Apply authentication to all routes
router.use(verifyToken);

router.post(
    '/',
    authorize('ADMIN', 'RESPONDER'),
    upload.array('files', 5), // Allow up to 5 files
    createDocumentation
);

router.get(
    '/',
    authorize('ADMIN', 'RESPONDER'),
    getAllDocumentation
);

router.get(
    '/:id',
    authorize('ADMIN', 'RESPONDER'),
    getDocumentationById
);

module.exports = router;
