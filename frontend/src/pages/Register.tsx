import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';
import { UserCircle, Lock, Mail } from 'lucide-react';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('STUDENT');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await api.post('/auth/register', { name, email, password, role });
      setSuccess('Registration successful. Please login.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: unknown) {
      const errorMessage = (err as any).response?.data?.message || 'Failed to register';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper" style={{ padding: '2rem' }}>
      <div className="auth-card glass-panel" style={{ maxWidth: '500px' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.75rem', margin: '0 0 0.5rem 0' }}>Join Smart Attend</h1>
          <p>Create an account to start managing attendance</p>
        </div>

        {error && (
          <div style={{ background: 'var(--danger)', color: 'white', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ background: 'var(--accent-secondary)', color: 'white', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', textAlign: 'center' }}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          
          <div className="input-group">
            <label>Full Name</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>
                <UserCircle size={20} />
              </div>
              <input type="text" className="input-field" style={{ width: '100%', paddingLeft: '2.75rem' }} value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
          </div>

          <div className="input-group">
            <label>Email Address</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>
                <Mail size={20} />
              </div>
              <input type="email" className="input-field" style={{ width: '100%', paddingLeft: '2.75rem' }} value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
          </div>

          <div className="input-group">
            <label>Password</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>
                <Lock size={20} />
              </div>
              <input type="password" className="input-field" style={{ width: '100%', paddingLeft: '2.75rem' }} value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
          </div>

          <div className="input-group">
            <label>Role</label>
            <select className="input-field" style={{ width: '100%' }} value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="STUDENT">Student</option>
              <option value="TEACHER">Teacher</option>
            </select>
          </div>



          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '0.85rem' }} disabled={loading}>
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 600 }}>Sign In</Link>
        </div>

      </div>
    </div>
  );
}

export default Register;
