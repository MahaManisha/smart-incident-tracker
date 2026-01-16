import axiosInstance from './axiosConfig';

// Get all incidents with filters
export const getAllIncidents = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const response = await axiosInstance.get(`/incidents?${queryString}`);
  return response;
};

// Get single incident by ID
export const getIncidentById = async (id) => {
  const response = await axiosInstance.get(`/incidents/${id}`);
  return response;
};

// Create new incident
export const createIncident = async (incidentData) => {
  const response = await axiosInstance.post('/incidents', incidentData);
  return response;
};

// Update incident
export const updateIncident = async (id, incidentData) => {
  const response = await axiosInstance.patch(`/incidents/${id}`, incidentData);
  return response;
};

// Delete incident
export const deleteIncident = async (id) => {
  const response = await axiosInstance.delete(`/incidents/${id}`);
  return response;
};

// ✅ FIX: Changed from PATCH to PUT to match backend route
export const assignIncident = async (id, responderId) => {
  const response = await axiosInstance.put(`/incidents/${id}/assign`, {
    responderId,
  });
  return response;
};

// ✅ FIX: Changed from PATCH to PUT to match backend route
export const updateIncidentStatus = async (id, status, notes) => {
  const response = await axiosInstance.put(`/incidents/${id}/status`, {
    status,
    notes,
  });
  return response;
};

// Add comment to incident
export const addComment = async (id, commentData) => {
  const response = await axiosInstance.post(`/incidents/${id}/comments`, commentData);
  return response;
};

// Get incident comments
export const getIncidentComments = async (id) => {
  const response = await axiosInstance.get(`/incidents/${id}/comments`);
  return response;
};

// Escalate incident
export const escalateIncident = async (id, escalationData) => {
  const response = await axiosInstance.post(`/incidents/${id}/escalate`, escalationData);
  return response;
};

// Get my incidents (for responders/reporters)
export const getMyIncidents = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const response = await axiosInstance.get(`/incidents/my?${queryString}`);
  return response;
};