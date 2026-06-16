import axiosInstance from './axiosConfig';
import { API } from './config';

// Get all users
export const getAllUsers = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const response = await axiosInstance.get(`${API}/api/users?${queryString}`);
  return response;
};

// Get single user by ID
export const getUserById = async (id) => {
  const response = await axiosInstance.get(`${API}/api/users/${id}`);
  return response;
};

// Create new user
export const createUser = async (userData) => {
  const response = await axiosInstance.post(`${API}/api/users`, userData);
  return response;
};

// ✅ FIXED: Update user (PUT, not PATCH)
export const updateUser = async (id, userData) => {
  const response = await axiosInstance.put(`${API}/api/users/${id}`, userData);
  return response;
};

// Delete user
export const deleteUser = async (id) => {
  const response = await axiosInstance.delete(`${API}/api/users/${id}`);
  return response;
};

// Get users by role
export const getUsersByRole = async (role) => {
  const response = await axiosInstance.get(`${API}/api/users?role=${role}`);
  return response;
};

// Get responders
export const getResponders = async () => {
  const response = await axiosInstance.get(`${API}/api/users?role=RESPONDER`);
  return response;
};

// Change password for authenticated user
export const changePassword = async (passwordData) => {
  const response = await axiosInstance.put(`${API}/api/users/change-password`, passwordData);
  return response;
};

// ✅ ADDED: Update own profile (Self)
export const updateUserProfile = async (userData) => {
  const response = await axiosInstance.put(`${API}/api/users/profile`, userData, {
    headers: {
      'Content-Type': undefined // Let browser set multipart/form-data with boundary
    }
  });
  return response;
};