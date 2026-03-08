const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const dependencyController = require('../controllers/serviceDependencyController');
const { verifyToken, isAdmin, isResponderOrAdmin } = require('../middleware/auth');

// Service Routes
router.get('/services', verifyToken, serviceController.getAllServices);
router.post('/services', verifyToken, isResponderOrAdmin, serviceController.createService);
router.put('/services/:id', verifyToken, isResponderOrAdmin, serviceController.updateService);
router.delete('/services/:id', verifyToken, isResponderOrAdmin, serviceController.deleteService);

// Dependency Routes
router.get('/graph', verifyToken, dependencyController.getGraph);
router.get('/dependencies', verifyToken, dependencyController.getAllDependencies);
router.post('/dependencies', verifyToken, isAdmin, dependencyController.createDependency);
router.delete('/dependencies/:id', verifyToken, isAdmin, dependencyController.deleteDependency);

// Impact Analysis
router.get('/services/:serviceId/impact', verifyToken, dependencyController.getImpactAnalysis);

module.exports = router;
