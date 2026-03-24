import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import api from '../../lib/api';
import { RefreshCw, ShieldCheck } from 'lucide-react';

const QRGenerator = () => {
  const [token, setToken] = useState<string | null>(null);
  const [studentName, setStudentName] = useState<string | null>(null);
  const [className, setClassName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchToken = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/attendance/generate-qr');
      setToken(res.data.qrToken);
      setStudentName(res.data.studentName);
      setClassName(res.data.className);
    } catch (err: any) {
      setError('Failed to generate permanent QR token. Make sure you are assigned to a class.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchToken();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', animation: 'slideUp 0.3s ease' }}>
      
      <div className="glass-panel" style={{ textAlign: 'center', maxWidth: '450px', width: '100%', padding: '3rem 2rem' }}>
        <div style={{
          display: 'inline-flex',
          background: 'rgba(16, 185, 129, 0.1)',
          padding: '1rem',
          borderRadius: '50%',
          marginBottom: '1.5rem',
          color: 'var(--accent-secondary)'
        }}>
          <ShieldCheck size={48} />
        </div>
        
        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Your Attendance QR</h1>
        <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>Show this to your teacher to get marked.</p>

        {studentName && className && (
          <div style={{ marginBottom: '2rem', background: 'var(--bg-primary)', padding: '1rem', borderRadius: '0.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{studentName}</h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{className}</p>
          </div>
        )}

        {error && (
          <div style={{ color: 'var(--danger)', marginBottom: '1rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '0.5rem' }}>
            {error}
          </div>
        )}

        <div className="qr-container" style={{ padding: '2rem', display: 'flex', justifyContent: 'center', backgroundColor: '#fff', marginBottom: '1.5rem' }}>
          {loading && !token ? (
            <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
              <RefreshCw className="spinner" size={32} style={{ animation: 'spin 1s linear infinite' }} />
            </div>
          ) : token ? (
            <QRCodeSVG value={token} size={250} level="H" includeMargin={true} />
          ) : (
             <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               No QR generated
             </div>
          )}
        </div>

        <p style={{ fontSize: '0.85rem', marginTop: '1.5rem', opacity: 0.7 }}>
          This is your permanent attendance QR code.
        </p>
      </div>

    </div>
  );
};

export default QRGenerator;

