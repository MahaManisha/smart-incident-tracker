import axiosInstance from './axiosConfig';

// Get all SLA policies
export const getAllSLAPolicies = async () => {
    const response = await axiosInstance.get('/api/sla');
    return response.slaRules || []; // Ensure array return
};

// Create new SLA policy
export const createSLAPolicy = async (slaData) => {
    const response = await axiosInstance.post('/api/sla', slaData);
    return response.slaRule;
};

// Get SLA policy by ID
export const getSLAPolicyById = async (id) => {
    const response = await axiosInstance.get(`/api/sla/${id}`);
    return response.slaRule;
};

// Update SLA policy
export const updateSLAPolicy = async (id, slaData) => {
    const response = await axiosInstance.put(`/api/sla/${id}`, slaData);
    return response.slaRule;
};

// Toggle SLA activation status
export const toggleSLAActivation = async (id, isActive) => {
    const response = await axiosInstance.patch(`/api/sla/${id}/activate`, { isActive });
    return response.slaRule;
};

// Delete SLA policy
export const deleteSLAPolicy = async (id) => {
    return await axiosInstance.delete(`/api/sla/${id}`);
};

// Get SLA compliance metrics
export const getSLACompliance = async (startDate, endDate) => {
    const response = await axiosInstance.get('/api/sla/compliance', {
        params: { startDate, endDate }
    });
    return response;
};
