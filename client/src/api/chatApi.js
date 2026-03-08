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
export const sendMessage = async (teamId, content) => {
    try {
        const response = await axiosInstance.post(`/messages/${teamId}`, { content });
        return response;
    } catch (error) {
        throw error;
    }
};
