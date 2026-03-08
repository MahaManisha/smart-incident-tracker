const express = require('express');
const router = express.Router();
const templateController = require('../controllers/incidentTemplateController');
const { verifyToken, isAdmin } = require('../middleware/auth');

router.get('/', verifyToken, templateController.getAllTemplates);
router.get('/:id', verifyToken, templateController.getTemplateById);

// Admin-only routes
router.post('/', verifyToken, isAdmin, templateController.createTemplate);
router.put('/:id', verifyToken, isAdmin, templateController.updateTemplate);
router.delete('/:id', verifyToken, isAdmin, templateController.deleteTemplate);

module.exports = router;
