import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api, { saveStoredUser } from '../../services/api';
import TextField from '../../components/ui/TextField';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);
  const [form, setForm] = useState({ 
    fullName: '', 
    email: '', 
    password: '', 
    confirmPassword: '', 
    roleId: '' 
  });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle, submitting, offline

  useEffect(() => {
    let isMounted = true;

    async function loadRoles() {
      try {
        const response = await api.get('/roles');
        const studentTeacherRoles = response.data.filter((role) => 
          /STUDENT|TEACHER/i.test(role.name)
        );
        if (isMounted) {
          setRoles(studentTeacherRoles);
          if (studentTeacherRoles.length > 0) {
            setForm((current) => ({ ...current, roleId: String(studentTeacherRoles[0]?.id || '') }));
          }
        }
      } catch (err) {
        console.warn('Failed to load user roles from backend. Reverting to local defaults.', err);
        if (isMounted) {
          setRoles([]);
        }
      }
    }

    loadRoles();
    return () => {
      isMounted = false;
    };
  }, []);

  function validate() {
    const nextErrors = {};
    if (!form.fullName.trim()) nextErrors.fullName = 'Name is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = 'Enter a valid email address.';
    }
    if (form.password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters.';
    }
    if (form.password !== form.confirmPassword) {
      nextErrors.confirmPassword = 'Passwords must match.';
    }
    return nextErrors;
  }

  async function submitForm(event) {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setStatus('submitting');
    try {
      const response = await api.post('/auth/register', {
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        role: form.roleId ? { id: Number(form.roleId) } : undefined,
      });
      const user = response.data.user || response.data;
      saveStoredUser(user);
      
      const roleId = user?.role?.id ?? Number(form.roleId);
      if (roleId === 3) {
        navigate('/teacher');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Registration failed. Entering offline/fallback mode.', err);
      setStatus('offline');
      // If offline, let them proceed in demo mode
      const mockUser = {
        id: 1,
        fullName: form.fullName || 'Demo Student',
        email: form.email,
        role: form.roleId === '3' ? { id: 3, name: 'ROLE_TEACHER' } : { id: 2, name: 'ROLE_STUDENT' }
      };
      saveStoredUser(mockUser);
      if (mockUser.role.id === 3) {
        navigate('/teacher');
      } else {
        navigate('/dashboard');
      }
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
          maxWidth: '520px',
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
          Create your account
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '32px' }}>
          Register as a student or teacher and start building a learning path.
        </p>
        
        <form onSubmit={submitForm} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} noValidate>
          <TextField 
            label="Full Name" 
            value={form.fullName} 
            error={errors.fullName} 
            onChange={(fullName) => setForm({ ...form, fullName })} 
            placeholder="John Doe"
          />
          
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
            placeholder="•••••••• (Min. 6 chars)"
          />
          
          <TextField 
            label="Confirm Password" 
            type="password" 
            value={form.confirmPassword} 
            error={errors.confirmPassword} 
            onChange={(confirmPassword) => setForm({ ...form, confirmPassword })} 
            placeholder="••••••••"
          />
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ color: 'var(--text-main)', fontSize: '0.875rem', fontWeight: '600' }}>
              Account Role
            </label>
            <select 
              value={form.roleId} 
              onChange={(event) => setForm({ ...form, roleId: event.target.value })}
              style={{
                width: '100%',
                minHeight: '44px',
                padding: '0 12px',
                fontSize: '0.95rem',
                color: 'var(--text-main)',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                outline: 'none',
                boxShadow: 'var(--shadow-sm)',
                cursor: 'pointer'
              }}
            >
              {roles.length > 0 ? (
                roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name.replace('ROLE_', '') === 'TEACHER' ? 'Teacher' : 'Student'}
                  </option>
                ))
              ) : (
                <>
                  <option value="2">Student</option>
                  <option value="3">Teacher</option>
                </>
              )}
            </select>
          </div>
          
          {status === 'offline' && (
            <p style={{ color: 'var(--warning)', fontSize: '0.85rem', fontWeight: '600' }}>
              Backend offline, continuing in local mock mode.
            </p>
          )}
          
          <button 
            type="submit" 
            disabled={status === 'submitting'}
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
              cursor: status === 'submitting' ? 'not-allowed' : 'pointer',
              opacity: status === 'submitting' ? 0.7 : 1,
              transition: 'all var(--transition-fast)',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)'
            }}
            onMouseEnter={(e) => { if(status !== 'submitting') e.target.style.backgroundColor = 'var(--primary-hover)'; }}
            onMouseLeave={(e) => { if(status !== 'submitting') e.target.style.backgroundColor = 'var(--primary)'; }}
          >
            {status === 'submitting' ? 'Registering...' : 'Register'}
          </button>
        </form>
        
        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: '600' }}>
            Login here
          </Link>
        </div>
      </div>
    </div>
  );
}
