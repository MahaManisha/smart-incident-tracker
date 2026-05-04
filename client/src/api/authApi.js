import axiosInstance from './axiosConfig';

// Login
export const login = async (credentials) => {
  const response = await axiosInstance.post('/api/auth/login', credentials);
  return response;
};

// Register
export const register = async (userData) => {
  const response = await axiosInstance.post('/api/auth/register', userData);
  return response;
};

// Get current user
export const getCurrentUser = async () => {
  const response = await axiosInstance.get('/api/auth/me');
  return response;
};

// Logout
export const logout = async () => {
  const response = await axiosInstance.post('/api/auth/logout');
  return response;
};

// Change password
export const changePassword = async (passwordData) => {
  const response = await axiosInstance.post('/api/auth/change-password', passwordData);
  return response;
};

// Forgot password
export const forgotPassword = async (email) => {
  const response = await axiosInstance.post('/api/auth/forgot-password', { email });
  return response;
};

// Reset password
export const resetPassword = async (token, password) => {
  const response = await axiosInstance.post('/api/auth/reset-password', { token, password });
  return response;
};