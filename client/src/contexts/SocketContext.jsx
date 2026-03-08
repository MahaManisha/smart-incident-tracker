import { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const { user, token } = useAuth(); // Assuming AuthContext provides token

    useEffect(() => {
        let newSocket;

        if (user && token) {
            // Initialize socket connection
            // Use relative path or env var for URL. In dev, usually localhost:5000
            // If proxy is set up in vite config, '/' works.
            const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

            newSocket = io(SOCKET_URL, {
                auth: { token },
                transports: ['websocket'],
                reconnection: true,
            });

            newSocket.on('connect', () => {
                console.log('Socket connected:', newSocket.id);
                // Join user-specific room
                newSocket.emit('join_user_room', user.id || user._id);
            });

            newSocket.on('connect_error', (err) => {
                console.error('Socket connection error:', err);
            });

            setSocket(newSocket);
        }

        return () => {
            if (newSocket) {
                console.log('Disconnecting socket...');
                newSocket.disconnect();
            }
        };
    }, [user, token]);

    const value = {
        socket
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};
