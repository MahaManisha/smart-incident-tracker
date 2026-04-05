import axiosInstance from './axiosConfig';

export const getServices = async () => {
    return await axiosInstance.get('/mapping/services');
};

export const createService = async (serviceData) => {
    return await axiosInstance.post('/mapping/services', serviceData);
};

export const updateService = async (id, serviceData) => {
    return await axiosInstance.put(`/mapping/services/${id}`, serviceData);
};

export const deleteService = async (id) => {
    return await axiosInstance.delete(`/mapping/services/${id}`);
};

export const getDependencies = async () => {
    return await axiosInstance.get('/mapping/dependencies');
};

export const getGraph = async () => {
    return await axiosInstance.get('/mapping/graph');
};

export const getTopologyForIncident = async (incidentId, simulate = false) => {
    return await axiosInstance.get(`/mapping/topology/${incidentId}?simulate=${simulate}`);
};

export const createDependency = async (dependencyData) => {
    return await axiosInstance.post('/mapping/dependencies', dependencyData);
};

export const deleteDependency = async (id) => {
    return await axiosInstance.delete(`/mapping/dependencies/${id}`);
};

export const getImpactAnalysis = async (serviceId) => {
    return await axiosInstance.get(`/mapping/services/${serviceId}/impact`);
};

export const getServiceStatus = async (serviceId) => {
    return await axiosInstance.get(`/mapping/services/${serviceId}/status`);
};
