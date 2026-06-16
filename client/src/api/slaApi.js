import axiosInstance from './axiosConfig';
import { API } from './config';

// Get all SLA policies
export const getAllSLAPolicies = async () => {
    const response = await axiosInstance.get(`${API}/api/sla`);
    return response.slaRules || []; // Ensure array return
};

// Create new SLA policy
export const createSLAPolicy = async (slaData) => {
    const response = await axiosInstance.post(`${API}/api/sla`, slaData);
    return response.slaRule;
};

// Get SLA policy by ID
export const getSLAPolicyById = async (id) => {
    const response = await axiosInstance.get(`${API}/api/sla/${id}`);
    return response.slaRule;
};

// Update SLA policy
export const updateSLAPolicy = async (id, slaData) => {
    const response = await axiosInstance.put(`${API}/api/sla/${id}`, slaData);
    return response.slaRule;
};

// Toggle SLA activation status
export const toggleSLAActivation = async (id, isActive) => {
    const response = await axiosInstance.patch(`${API}/api/sla/${id}/activate`, { isActive });
    return response.slaRule;
};

// Delete SLA policy
export const deleteSLAPolicy = async (id) => {
    return await axiosInstance.delete(`${API}/api/sla/${id}`);
};

// Get SLA compliance metrics
export const getSLACompliance = async (startDate, endDate) => {
    const response = await axiosInstance.get(`${API}/api/sla/compliance`, {
        params: { startDate, endDate }
    });
    return response;
};
