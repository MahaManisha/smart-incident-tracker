import axiosInstance from './axiosConfig';

export const getTemplates = async () => {
    return await axiosInstance.get('/incident-templates');
};

export const createTemplate = async (templateData) => {
    return await axiosInstance.post('/incident-templates', templateData);
};

export const updateTemplate = async (id, templateData) => {
    return await axiosInstance.put(`/incident-templates/${id}`, templateData);
};

export const deleteTemplate = async (id) => {
    return await axiosInstance.delete(`/incident-templates/${id}`);
};
