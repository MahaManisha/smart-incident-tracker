import axiosInstance from './axiosConfig';

export const getMyDocuments = async (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.incident_id) query.append('incident_id', params.incident_id);
    if (params.file_type) query.append('file_type', params.file_type);
    if (params.date) query.append('date', params.date);

    const response = await axiosInstance.get(`/api/reporter/documents?${query.toString()}`);
    return response;
};

export const uploadDocument = async (formData) => {
    const response = await axiosInstance.post('/api/reporter/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response;
};

export const updateDocument = async (id, formData) => {
    const response = await axiosInstance.put(`/api/reporter/documents/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response;
};

export const deleteDocument = async (id) => {
    const response = await axiosInstance.delete(`/api/reporter/documents/${id}`);
    return response;
};
