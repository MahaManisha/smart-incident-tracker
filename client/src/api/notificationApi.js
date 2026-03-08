import axiosInstance from './axiosConfig';

// Get all notifications for current user
export const getNotifications = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const response = await axiosInstance.get(`/notifications?${queryString}`);
  return response;
};

// Get unread notifications count
export const getUnreadCount = async () => {
  const response = await axiosInstance.get('/notifications/unread-count');
  return response;
};

// Mark notification as read
export const markAsRead = async (id) => {
  const response = await axiosInstance.patch(`/notifications/${id}/read`);
  return response;
};

// Mark all notifications as read
export const markAllAsRead = async () => {
  const response = await axiosInstance.patch('/notifications/read-all');
  return response;
};

// Delete notification
export const deleteNotification = async (id) => {
  const response = await axiosInstance.delete(`/notifications/${id}`);
  return response;
};