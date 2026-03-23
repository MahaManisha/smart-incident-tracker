import axiosInstance from './axiosConfig';

// Get messages for a team
export const getTeamMessages = async (teamId) => {
    try {
        const response = await axiosInstance.get(`/messages/${teamId}`);
        return response; // returns array of messages
    } catch (error) {
        throw error;
    }
};

// Send a message (HTTP fallback / persistence)
export const sendMessage = async (teamId, content, replyTo = null, image = null) => {
    try {
        const payload = { content };
        if (replyTo) payload.replyTo = replyTo;
        if (image) payload.image = image;
        
        const response = await axiosInstance.post(`/messages/${teamId}`, payload);
        return response.data || response;
    } catch (error) {
        throw error;
    }
};
