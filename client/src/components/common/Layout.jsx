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
    <div className="infinitum-layout">
      {/* Global Cyber Background - Matching Landing Page */}
      <div className="cyber-overlay">
          <div className="cyber-grid"></div>
          <div className="cyber-lines">
              <div className="line l1"></div>
              <div className="line l2"></div>
              <div className="line l3"></div>
          </div>
          <div className="cyber-particles">
              <div className="particle p1"></div>
              <div className="particle p2"></div>
              <div className="particle p3"></div>
              <div className="particle p4"></div>
          </div>
          <div className="cyber-scanlines"></div>
          <div className="cyber-noise"></div>
      </div>

      <Sidebar isOpen={isSidebarOpen} />

      <div className="main-content-wrapper" style={{
        marginLeft: isSidebarOpen ? 'var(--sidebar-width)' : 'var(--sidebar-width-collapsed)'
      }}>
        <Navbar onToggleSidebar={toggleSidebar} />
        <main className="main-viewport">
          <div className="viewport-container">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;