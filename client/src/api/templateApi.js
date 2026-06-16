import axiosInstance from './axiosConfig';
import { API } from './config';

export const getTemplates = async () => {
    return await axiosInstance.get(`${API}/api/incident-templates`);
};

export const createTemplate = async (templateData) => {
    return await axiosInstance.post(`${API}/api/incident-templates`, templateData);
};

export const updateTemplate = async (id, templateData) => {
    return await axiosInstance.put(`${API}/api/incident-templates/${id}`, templateData);
};

export const deleteTemplate = async (id) => {
    return await axiosInstance.delete(`${API}/api/incident-templates/${id}`);
};
