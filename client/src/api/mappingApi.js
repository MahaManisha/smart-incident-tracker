import axiosInstance from './axiosConfig';

export const getServices = async () => {
    return await axiosInstance.get('/api/mapping/services');
};

export const createService = async (serviceData) => {
    return await axiosInstance.post('/api/mapping/services', serviceData);
};

export const updateService = async (id, serviceData) => {
    return await axiosInstance.put(`/api/mapping/services/${id}`, serviceData);
};

export const deleteService = async (id) => {
    return await axiosInstance.delete(`/api/mapping/services/${id}`);
};

export const getDependencies = async () => {
    return await axiosInstance.get('/api/mapping/dependencies');
};

export const getGraph = async () => {
    return await axiosInstance.get('/api/mapping/graph');
};

export const getTopologyForIncident = async (incidentId, simulate = false) => {
    return await axiosInstance.get(`/api/mapping/topology/${incidentId}?simulate=${simulate}`);
};

export const createDependency = async (dependencyData) => {
    return await axiosInstance.post('/api/mapping/dependencies', dependencyData);
};

export const deleteDependency = async (id) => {
    return await axiosInstance.delete(`/api/mapping/dependencies/${id}`);
};

export const getImpactAnalysis = async (serviceId) => {
    return await axiosInstance.get(`/api/mapping/services/${serviceId}/impact`);
};

export const getServiceStatus = async (serviceId) => {
    return await axiosInstance.get(`/api/mapping/services/${serviceId}/status`);
};
