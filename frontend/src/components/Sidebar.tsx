
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, 
  QrCode,
  ScanLine,
  LogOut, 
  UserCircle
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const isStudent = user?.role === 'STUDENT';
  const rolePrefix = isStudent ? '/student' : '/teacher';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile-only header */}
      <div className="mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ background: 'var(--accent-primary)', color: 'white', borderRadius: '0.4rem', padding: '0.3rem' }}>
            <QrCode size={18} />
          </div>
          <span style={{ fontWeight: 700 }}>Smart Attend</span>
        </div>
        <button onClick={handleLogout} style={{ background: 'transparent', border: 'none', color: 'var(--danger)' }}>
          <LogOut size={20} />
        </button>
      </div>

      <aside className="sidebar">
        <div className="logo-section" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{
            background: 'var(--accent-primary)',
            color: 'white',
            borderRadius: '0.5rem',
            padding: '0.5rem'
          }}>
            <QrCode size={24} />
          </div>
          <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Smart Attend</h2>
        </div>

        <div className="user-profile" style={{
          background: 'var(--bg-primary)',
          padding: '1rem',
          borderRadius: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '1rem'
        }}>
          <UserCircle size={36} color="var(--text-secondary)" />
          <div>
            <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{user?.name}</p>
            <p style={{ margin: 0, fontSize: '0.75rem' }}>{user?.role}</p>
          </div>
        </div>

        <nav className="nav-links">
          <NavLink 
            to={`${rolePrefix}/dashboard`} 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </NavLink>

          {isStudent ? (
             <NavLink 
               to={`${rolePrefix}/qr`} 
               className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
             >
               <QrCode size={20} />
               <span>QR Code</span>
             </NavLink>
          ) : (
             <NavLink 
               to={`${rolePrefix}/scan`} 
               className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
             >
               <ScanLine size={20} />
               <span>Scan</span>
             </NavLink>
          )}

        </nav>

        <div className="logout-section" style={{ marginTop: 'auto' }}>
          <button onClick={handleLogout} className="nav-item" style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
