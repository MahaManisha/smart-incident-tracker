import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import axiosInstance from '../api/axiosConfig';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';

const NotificationContext = createContext();

export const useNotifications = () => {
  return useContext(NotificationContext);
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState(null);

  // Fetch initial notifications
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const response = await axiosInstance.get('/notifications?unreadOnly=false'); // Fetch all on load
      setNotifications(response.data?.notifications || []);
      setUnreadCount(response.data?.unreadCount || 0);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();

      // Connect Socket
      const newSocket = io('http://localhost:5000'); // Ensure matches backend
      setSocket(newSocket);

      // Listen for notifications
      // Based on notificationService, we need to know what event is emitted.
      // Wait, notificationService just creates DB entries. Who emits socket?
      // The implementation plan mentioned socket, but I didn't add emission logic to notificationService yet!
      // I should update notificationService to emit socket events, or rely on a "notification" event.
      // Let's assume the backend will emit 'notification' event.
      // I need to go back and fix notificationService to emit events?
      // Or maybe I can add it now.

      newSocket.on('notification', (notification) => {
        setNotifications((prev) => [notification, ...prev]);
        setUnreadCount((prev) => prev + 1);
        toast.info(`New Notification: ${notification.title}`);
      });

      return () => newSocket.close();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user]);

  const markAsRead = async (id) => {
    try {
      await axiosInstance.put(`/notifications/${id}/read`);

      if (id === 'all') {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
      } else {
        setNotifications(notifications.map(n =>
          n._id === id ? { ...n, read: true } : n
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const value = {
    notifications,
    unreadCount,
    markAsRead,
    fetchNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};