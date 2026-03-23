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
      setNotifications(response?.notifications || []);
      setUnreadCount(response?.unreadCount || 0);
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

      // Join user specific room to receive personalized notifications
      newSocket.emit('join_user_room', user._id || user.id);

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