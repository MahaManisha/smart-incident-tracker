import axiosInstance from './axiosConfig';
import { API } from './config';

// Get dashboard statistics (role-aware)
export const getDashboardStats = async () => {
  // Admin and Responder get global dashboard data
  const response = await axiosInstance.get(`${API}/api/analytics/dashboard`);
  return response;
};

// Get incident trends
export const getIncidentTrends = async (days = 30) => {
  const response = await axiosInstance.get(`${API}/api/analytics/trends?days=${days}`);
  return response;
};

// Get incidents by severity
export const getIncidentsBySeverity = async () => {
  const response = await axiosInstance.get(`${API}/api/analytics/by-severity`);
  return response;
};

// Get incidents by status
export const getIncidentsByStatus = async () => {
  const response = await axiosInstance.get(`${API}/api/analytics/by-status`);
  return response;
};

// Get SLA compliance report
export const getSLACompliance = async (days = 30) => {
  const response = await axiosInstance.get(`${API}/api/analytics/sla-compliance?days=${days}`);
  return response;
};

// Get responder performance
export const getResponderPerformance = async (days = 30) => {
  const response = await axiosInstance.get(`${API}/api/analytics/responder-performance?days=${days}`);
  return response;
};

// Get average resolution time
export const getAverageResolutionTime = async (days = 30) => {
  const response = await axiosInstance.get(`${API}/api/analytics/avg-resolution-time?days=${days}`);
  return response;
};

// Get team performance
export const getTeamPerformance = async () => {
  const response = await axiosInstance.get(`${API}/api/analytics/teams`);
  return response;
};

// Export report
export const exportReport = async (filters = {}) => {
  // We'll assume the backend handles the download or returns a URL (for now JSON placeholder)
  const response = await axiosInstance.post(`${API}/api/analytics/export`, {
    reportType: 'dashboard',
    format: 'csv',
    filters
  });
  return response;
};