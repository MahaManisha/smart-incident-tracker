const express = require('express');
const router = express.Router();
const {
    createSchedule,
    getAllSchedules,
    getCurrentOnCall,
    deleteSchedule
} = require('../controllers/onCallController');
const { verifyToken, isAdmin, isResponderOrAdmin } = require('../middleware/auth');

// Public to authenticated users (to see who's on call)
router.get('/current', verifyToken, getCurrentOnCall);
router.get('/', verifyToken, isResponderOrAdmin, getAllSchedules);

// Management restricted to Admins
router.post('/', verifyToken, isAdmin, createSchedule);
router.delete('/:id', verifyToken, isAdmin, deleteSchedule);

module.exports = router;
