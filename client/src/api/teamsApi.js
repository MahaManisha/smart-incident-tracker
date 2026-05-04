import axiosInstance from './axiosConfig';

// Get all teams
export const getAllTeams = async () => {
  const response = await axiosInstance.get('/api/teams');
  return response; // response.data is handled by interceptor usually, or returns { success, teams } 
  // Assuming axiosInstance interceptor returns response.data
};

// Get single team by ID
export const getTeamById = async (id) => {
  const response = await axiosInstance.get(`/api/teams/${id}`);
  return response;
};

// Create team
export const createTeam = async (teamData) => {
  const response = await axiosInstance.post('/api/teams', teamData);
  return response;
};

// Update team
export const updateTeam = async (id, teamData) => {
  const response = await axiosInstance.patch(`/api/teams/${id}`, teamData);
  return response;
};

// Delete team
export const deleteTeam = async (id) => {
  const response = await axiosInstance.delete(`/api/teams/${id}`);
  return response;
};

// Add member
export const addTeamMember = async (id, userId) => {
  const response = await axiosInstance.post(`/api/teams/${id}/members`, { userId });
  return response;
};

// Remove member
export const removeTeamMember = async (id, userId) => {
  const response = await axiosInstance.delete(`/api/teams/${id}/members/${userId}`);
  return response;
};