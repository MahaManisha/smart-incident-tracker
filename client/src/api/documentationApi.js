import axiosInstance from './axiosConfig';
import { API } from './config';

export const createDocumentation = async (formData) => {
    const response = await axiosInstance.post(`${API}/api/documentation`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response;
};

export const getAllDocumentation = async () => {
    const response = await axiosInstance.get(`${API}/api/documentation`);
    return response;
};

export const getDocumentationById = async (id) => {
    const response = await axiosInstance.get(`${API}/api/documentation/${id}`);
    return response;
};

export const getDocumentationByIncidentId = async (incidentId) => {
    const response = await axiosInstance.get(`${API}/api/incidents/${incidentId}/documentation`);
    return response;
};

export const updateDocumentation = async (incidentId, formData) => {
    const response = await axiosInstance.put(`${API}/api/incidents/${incidentId}/documentation`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response;
};
