import axiosInstance from './axiosConfig';

// Get dashboard statistics
export const getDashboardStats = async () => {
  const response = await axiosInstance.get('/analytics/dashboard');
  return response;
};

// Get incident trends
export const getIncidentTrends = async (days = 30) => {
  const response = await axiosInstance.get(`/analytics/trends?days=${days}`);
  return response;
};

// Get incidents by severity
export const getIncidentsBySeverity = async () => {
  const response = await axiosInstance.get('/analytics/by-severity');
  return response;
};

// Get incidents by status
export const getIncidentsByStatus = async () => {
  const response = await axiosInstance.get('/analytics/by-status');
  return response;
};

// Get SLA compliance report
export const getSLACompliance = async (days = 30) => {
  const response = await axiosInstance.get(`/analytics/sla-compliance?days=${days}`);
  return response;
};

// Get responder performance
export const getResponderPerformance = async (days = 30) => {
  const response = await axiosInstance.get(`/analytics/responder-performance?days=${days}`);
  return response;
};

// Get average resolution time
export const getAverageResolutionTime = async (days = 30) => {
  const response = await axiosInstance.get(`/analytics/avg-resolution-time?days=${days}`);
  return response;
};