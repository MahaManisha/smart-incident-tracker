import axiosInstance from './axiosConfig';

export const getTemplates = async () => {
    return await axiosInstance.get('/api/incident-templates');
};

export const createTemplate = async (templateData) => {
    return await axiosInstance.post('/api/incident-templates', templateData);
};

export const updateTemplate = async (id, templateData) => {
    return await axiosInstance.put(`/api/incident-templates/${id}`, templateData);
};

export const deleteTemplate = async (id) => {
    return await axiosInstance.delete(`/api/incident-templates/${id}`);
};
