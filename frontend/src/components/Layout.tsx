import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import socket from '../lib/socket';
import { useAuth } from '../contexts/AuthContext';

const Layout = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      socket.connect();
      
      const attendanceHandler = (data: any) => {
        alert(data.message || 'Attendance marked successfully!');
      };
      
      const notificationHandler = (data: any) => {
        alert(data.message);
      };

      socket.on(`attendance_marked_${user.id}`, attendanceHandler);
      socket.on(`notification_${user.id}`, notificationHandler);

      return () => {
        socket.off(`attendance_marked_${user.id}`, attendanceHandler);
        socket.off(`notification_${user.id}`, notificationHandler);
        socket.disconnect();
      };
    }
  }, [user]);

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <div className="content-inner">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
