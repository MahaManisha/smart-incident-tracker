import { useSettings } from '../../contexts/SettingsContext';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

import { useEffect } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { toast } from 'react-toastify';

const Layout = ({ children }) => {
  const { settings, updateSettings } = useSettings();
  const { socket } = useSocket();
  const isSidebarOpen = settings.layout.sidebar === 'expanded';

  useEffect(() => {
    if (!socket) return;

    // Listen for real-time notifications
    socket.on('notification', (data) => {
      // data: { title, message, type, ... }
      console.log('New notification:', data);

      // Play sound? (Optional)

      // Show toast
      toast.info(
        <div>
          <strong>{data.title}</strong>
          <div style={{ fontSize: '0.9em' }}>{data.message}</div>
        </div>,
        {
          position: "top-right",
          autoClose: 10000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        }
      );
    });

    return () => {
      socket.off('notification');
    };
  }, [socket]);

  const toggleSidebar = () => {
    updateSettings('layout', 'sidebar', isSidebarOpen ? 'collapsed' : 'expanded');
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar isOpen={isSidebarOpen} />

      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        marginLeft: isSidebarOpen ? 'var(--sidebar-width)' : 'var(--sidebar-width-collapsed)',
        transition: 'margin-left var(--transition-base)'
      }}>
        <Navbar onToggleSidebar={toggleSidebar} />
        <main style={{
          flex: 1,
          overflowY: 'auto',
          backgroundColor: 'var(--bg-secondary)',
          padding: 'var(--spacing-lg)'
        }}>
          <div style={{ maxWidth: 'var(--container-max-width)', margin: '0 auto' }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;