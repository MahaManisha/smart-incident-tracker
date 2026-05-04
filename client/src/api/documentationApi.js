import axiosInstance from './axiosConfig';

export const createDocumentation = async (formData) => {
    const response = await axiosInstance.post('/api/documentation', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response;
};

export const getAllDocumentation = async () => {
    const response = await axiosInstance.get('/api/documentation');
    return response;
};

export const getDocumentationById = async (id) => {
    const response = await axiosInstance.get(`/api/documentation/${id}`);
    return response;
};

export const getDocumentationByIncidentId = async (incidentId) => {
    const response = await axiosInstance.get(`/api/incidents/${incidentId}/documentation`);
    return response;
};

export const updateDocumentation = async (incidentId, formData) => {
    const response = await axiosInstance.put(`/api/incidents/${incidentId}/documentation`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response;
};
