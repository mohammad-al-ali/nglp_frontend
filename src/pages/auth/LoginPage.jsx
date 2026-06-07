import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api, { saveStoredUser } from '../../services/api';
import TextField from '../../components/ui/TextField';

export default function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validate() {
    const nextErrors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = 'Enter a valid email address.';
    }
    if (form.password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters.';
    }
    return nextErrors;
  }

  async function submitForm(event) {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      const response = await api.post('/auth/login', form);
      const user = response.data.user || response.data;
      
      // Ensure we save the user session
      saveStoredUser(user);
      
      // Extract role name to handle redirects
      const roleName = user.role?.name || user.role || '';
      const roleId = user.role?.id ?? null;
      
      if (/ADMIN/i.test(roleName) || roleId === 1) {
        navigate('/admin/categories');
      } else if (/TEACHER/i.test(roleName) || roleId === 3) {
        navigate('/teacher');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Login error:', err);
      setErrors({ 
        password: 'Invalid email or password, or the backend service is currently offline.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div 
      style={{ 
        display: 'grid', 
        minHeight: 'calc(100vh - var(--header-height))', 
        placeItems: 'center', 
        padding: '40px 24px',
        backgroundColor: 'var(--bg)',
        fontFamily: 'var(--font-sans)',
        animation: 'slideIn var(--transition-normal) forwards'
      }}
    >
      <div 
        className="premium-card"
        style={{
          width: '100%',
          maxWidth: '480px',
          padding: '40px',
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)'
        }}
      >
        <p style={{ margin: '0 0 6px', color: 'var(--primary)', fontSize: '0.78rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Account access
        </p>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', fontFamily: 'var(--font-display)', color: 'var(--text-main)', marginBottom: '8px' }}>
          Welcome back
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '32px' }}>
          Sign in to continue your courses and AI tutor sessions.
        </p>
        
        <form onSubmit={submitForm} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} noValidate>
          <TextField 
            label="Email Address" 
            type="email" 
            value={form.email} 
            error={errors.email} 
            onChange={(email) => setForm({ ...form, email })} 
            placeholder="name@example.com"
          />
          
          <TextField 
            label="Password" 
            type="password" 
            value={form.password} 
            error={errors.password} 
            onChange={(password) => setForm({ ...form, password })} 
            placeholder="••••••••"
          />
          
          <button 
            type="submit" 
            disabled={isSubmitting}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              minHeight: '44px',
              backgroundColor: 'var(--primary)',
              color: 'var(--text-inverse)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontWeight: '700',
              fontSize: '0.95rem',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.7 : 1,
              transition: 'all var(--transition-fast)',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)'
            }}
            onMouseEnter={(e) => { if(!isSubmitting) e.target.style.backgroundColor = 'var(--primary-hover)'; }}
            onMouseLeave={(e) => { if(!isSubmitting) e.target.style.backgroundColor = 'var(--primary)'; }}
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        
        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--primary)', fontWeight: '600' }}>
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
}
