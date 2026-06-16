import axiosInstance from './axiosConfig';
import { API } from './config';

export const getMyDocuments = async (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.incident_id) query.append('incident_id', params.incident_id);
    if (params.file_type) query.append('file_type', params.file_type);
    if (params.date) query.append('date', params.date);

    const response = await axiosInstance.get(`${API}/api/reporter/documents?${query.toString()}`);
    return response;
};

export const uploadDocument = async (formData) => {
    const response = await axiosInstance.post(`${API}/api/reporter/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response;
};

export const updateDocument = async (id, formData) => {
    const response = await axiosInstance.put(`${API}/api/reporter/documents/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response;
};

export const deleteDocument = async (id) => {
    const response = await axiosInstance.delete(`${API}/api/reporter/documents/${id}`);
    return response;
};
