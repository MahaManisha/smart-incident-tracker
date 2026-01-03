import axiosInstance from './axiosConfig';

// Get all users
export const getAllUsers = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const response = await axiosInstance.get(`/users?${queryString}`);
  return response;
};

// Get single user by ID
export const getUserById = async (id) => {
  const response = await axiosInstance.get(`/users/${id}`);
  return response;
};

// Create new user
export const createUser = async (userData) => {
  const response = await axiosInstance.post('/users', userData);
  return response;
};

// Update user
export const updateUser = async (id, userData) => {
  const response = await axiosInstance.patch(`/users/${id}`, userData);
  return response;
};

// Delete user
export const deleteUser = async (id) => {
  const response = await axiosInstance.delete(`/users/${id}`);
  return response;
};

// Get users by role
export const getUsersByRole = async (role) => {
  const response = await axiosInstance.get(`/users/role/${role}`);
  return response;
};

// Get responders (for assignment)
export const getResponders = async () => {
  const response = await axiosInstance.get('/users/responders');
  return response;
};