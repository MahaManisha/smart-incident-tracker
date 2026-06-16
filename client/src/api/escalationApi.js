import axiosInstance from './axiosConfig';
import { API } from './config';

export const getEscalationPolicies = async () => {
    const response = await axiosInstance.get(`${API}/api/escalation`);
    return response;
};

export const createEscalationPolicy = async (policyData) => {
    const response = await axiosInstance.post(`${API}/api/escalation`, policyData);
    return response;
};

export const deleteEscalationPolicy = async (id) => {
    const response = await axiosInstance.delete(`${API}/api/escalation/${id}`);
    return response;
};

export const getEscalationMetrics = async () => {
    const response = await axiosInstance.get(`${API}/api/analytics/escalations`);
    return response;
};
