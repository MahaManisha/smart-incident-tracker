import axiosInstance from './axiosConfig';

export const getEscalationPolicies = async () => {
    const response = await axiosInstance.get('/escalation');
    return response;
};

export const createEscalationPolicy = async (policyData) => {
    const response = await axiosInstance.post('/escalation', policyData);
    return response;
};

export const deleteEscalationPolicy = async (id) => {
    const response = await axiosInstance.delete(`/escalation/${id}`);
    return response;
};

export const getEscalationMetrics = async () => {
    const response = await axiosInstance.get('/analytics/escalations');
    return response;
};
