import axiosInstance from './axiosConfig';

export const getEscalationPolicies = async () => {
    const response = await axiosInstance.get('/api/escalation');
    return response;
};

export const createEscalationPolicy = async (policyData) => {
    const response = await axiosInstance.post('/api/escalation', policyData);
    return response;
};

export const deleteEscalationPolicy = async (id) => {
    const response = await axiosInstance.delete(`/api/escalation/${id}`);
    return response;
};

export const getEscalationMetrics = async () => {
    const response = await axiosInstance.get('/api/analytics/escalations');
    return response;
};
