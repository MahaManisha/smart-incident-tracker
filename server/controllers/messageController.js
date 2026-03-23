const Message = require('../models/Message');
const Team = require('../models/Team');

// Get messages for a team
const getTeamMessages = async (req, res) => {
    try {
        const { id: teamId } = req.params;

        // Authorization check
        // If not Admin, ensure user is member of the team
        if (req.user.role !== 'ADMIN') {
            const team = await Team.findById(teamId);
            if (!team) return res.status(404).json({ message: 'Team not found' });

            // Debug logs
            console.log(`[Chat Access] User: ${req.user._id} (${req.user.name}) accessing Team: ${team.name}`);

            const userId = req.user._id.toString();
            const isLead = team.lead && team.lead.toString() === userId;
            const isMember = team.members && team.members.some(m => m.toString() === userId);

            if (!isLead && !isMember) {
                console.log(`[Chat Access] Denied. isLead: ${isLead}, isMember: ${isMember}`);
                return res.status(403).json({ message: 'Access denied: You are not a member of this team' });
            }
        }

        const messages = await Message.find({ team: teamId })
            .populate('sender', 'name profileImage')
            .populate({
                path: 'replyTo',
                select: 'content sender image',
                populate: { path: 'sender', select: 'name' }
            })
            .sort({ createdAt: 1 }); // Oldest first

        res.json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ message: 'Error fetching messages' });
    }
};

// Send message (HTTP fallback / persistence)
// Ideally, socket triggers this, or this triggers socket emit
const sendMessage = async (req, res) => {
    try {
        const { id: teamId } = req.params;
        const { content, replyTo, image } = req.body;
        const senderId = req.user.id;

        const messageData = {
            team: teamId,
            sender: senderId,
            content
        };

        if (replyTo) messageData.replyTo = replyTo;
        if (image) messageData.image = image;

        const message = await Message.create(messageData);

        const populatedMessage = await Message.findById(message._id)
            .populate('sender', 'name profileImage')
            .populate({
                path: 'replyTo',
                select: 'content sender image',
                populate: { path: 'sender', select: 'name' }
            });

        res.status(201).json(populatedMessage);
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ message: 'Error sending message' });
    }
};

module.exports = {
    getTeamMessages,
    sendMessage
};
