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
export const updateIncidentStatus = async (id, status, notes, rootCause, resolutionNotes) => {
  const response = await axiosInstance.put(`/incidents/${id}/status`, {
    status,
    notes,
    rootCause,
    resolutionNotes
  });
  return response;
};

// Update incident priority (Admin/Responder only)
export const updateIncidentPriority = async (id, priority) => {
  const response = await axiosInstance.put(`/incidents/${id}/priority`, {
    priority,
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

// ========================================
// POST-INCIDENT DOCUMENTATION
// ========================================

/**
 * Create post-incident documentation
 * @param {string} incidentId - The incident ID
 * @param {FormData} formData - FormData object containing:
 *   - rootCause: string (required)
 *   - resolutionSteps: string (required)
 *   - preventionMeasures: string (required)
 *   - files: File[] (optional, multiple files)
 * @returns {Promise} API response
 */
export const createIncidentDocumentation = async (incidentId, formData) => {
  const response = await axiosInstance.post(
    `/incidents/${incidentId}/documentation`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response;
};

/**
 * Get post-incident documentation for a specific incident
 * @param {string} incidentId - The incident ID
 * @returns {Promise} API response with documentation data
 */
export const getIncidentDocumentation = async (incidentId) => {
  const response = await axiosInstance.get(`/incidents/${incidentId}/documentation`);
  return response;
};

/**
 * Get all resolved incidents with documentation (for Knowledge Base)
 * @param {object} params - Query parameters (pagination, filters, etc.)
 * @returns {Promise} API response with resolved incidents
 */
export const getResolvedIncidentsWithDocumentation = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const response = await axiosInstance.get(`/incidents/resolved/documentation?${queryString}`);
  return response;
};

// Get incident insights for decision support
export const getIncidentInsights = async (id) => {
  const response = await axiosInstance.get(`/incidents/${id}/insights`);
  return response;
};

// SLA Prediction
export const predictSlaBreach = async (id) => {
  const response = await axiosInstance.get(`/incidents/${id}/predict-sla`);
  return response;
};

// AI Suggestions (Root Cause + Fix)
export const getAISuggestions = async (id) => {
  const response = await axiosInstance.get(`/incidents/${id}/ai-suggestions`);
  return response;
};

// Smart Assignment Suggestions
export const getRecommendedResponders = async (id) => {
  const response = await axiosInstance.get(`/incidents/${id}/recommended-responders`);
  return response;
};

// Auto Postmortem Report
export const generatePostmortemReport = async (id) => {
  const response = await axiosInstance.get(`/incidents/${id}/postmortem`);
  return response;
};

// Auto Clustering (Admin Only)
export const clusterIncidents = async () => {
  const response = await axiosInstance.post('/incidents/cluster');
  return response;
};

