const express = require('express');
const router = express.Router();
const { getTeamMessages, sendMessage } = require('../controllers/messageController');
const { verifyToken } = require('../middleware/auth');
const { paramValidation, validate } = require('../middleware/validation');

// Get messages for a team
router.get(
    '/:id',
    verifyToken,
    paramValidation.mongoId,
    validate,
    getTeamMessages
);

// Send a message
router.post(
    '/:id',
    verifyToken,
    paramValidation.mongoId,
    validate,
    sendMessage
);

module.exports = router;
