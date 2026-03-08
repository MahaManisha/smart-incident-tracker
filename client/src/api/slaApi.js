import axiosInstance from './axiosConfig';

// Get all SLA policies
export const getAllSLAPolicies = async () => {
    const response = await axiosInstance.get('/sla');
    return response.slaRules || []; // Ensure array return
};

// Create new SLA policy
export const createSLAPolicy = async (slaData) => {
    const response = await axiosInstance.post('/sla', slaData);
    return response.slaRule;
};

// Get SLA policy by ID
export const getSLAPolicyById = async (id) => {
    const response = await axiosInstance.get(`/sla/${id}`);
    return response.slaRule;
};

// Update SLA policy
export const updateSLAPolicy = async (id, slaData) => {
    const response = await axiosInstance.put(`/sla/${id}`, slaData);
    return response.slaRule;
};

// Toggle SLA activation status
export const toggleSLAActivation = async (id, isActive) => {
    const response = await axiosInstance.patch(`/sla/${id}/activate`, { isActive });
    return response.slaRule;
};

// Delete SLA policy
export const deleteSLAPolicy = async (id) => {
    return await axiosInstance.delete(`/sla/${id}`);
};

// Get SLA compliance metrics
export const getSLACompliance = async (startDate, endDate) => {
    const response = await axiosInstance.get('/sla/compliance', {
        params: { startDate, endDate }
    });
    return response;
};
