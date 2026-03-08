const express = require('express');
const router = express.Router();
const {
    createPolicy,
    getPolicies,
    deletePolicy
} = require('../controllers/escalationController');
const { verifyToken, isAdmin } = require('../middleware/auth');

// All escalation policy routes are Admin only
router.post('/', verifyToken, isAdmin, createPolicy);
router.get('/', verifyToken, isAdmin, getPolicies);
router.delete('/:id', verifyToken, isAdmin, deletePolicy);

module.exports = router;
