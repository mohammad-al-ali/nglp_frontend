import { NavLink, Link } from 'react-router-dom';
import { getStoredUser } from '../services/api';

export default function Sidebar() {
  const user = getStoredUser();
  const roleStr = String(user?.role?.name || user?.role || '').toUpperCase();
  const isTeacher = roleStr.includes('TEACHER');
  const isStudent = roleStr.includes('STUDENT');
  const isAdmin = roleStr.includes('ADMIN');

  function handleLogout() {
    localStorage.clear();
    window.location.href = '/login';
  }

  // Helper for applying premium RTL active styles
  const navLinkStyle = ({ isActive }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 20px',
    fontSize: '0.95rem',
    fontWeight: isActive ? '700' : '500',
    color: isActive ? 'var(--primary)' : 'var(--text-muted)',
    backgroundColor: isActive ? 'var(--primary-soft)' : 'transparent',
    borderRight: isActive ? '4px solid var(--primary)' : '4px solid transparent',
    textDecoration: 'none',
    transition: 'all var(--transition-fast)',
    borderRadius: '0 var(--radius-md) var(--radius-md) 0',
    marginLeft: '12px', // leaves visual breathing room on the left
  });

  return (
    <aside 
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        height: '100vh',
        width: '280px',
        backgroundColor: 'var(--surface)',
        borderLeft: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100,
        fontFamily: 'var(--font-sans)',
        direction: 'rtl'
      }}
    >
      {/* Brand & IDE Logo */}
      <div 
        style={{ 
          height: '80px', 
          display: 'flex', 
          alignItems: 'center', 
          padding: '0 24px', 
          borderBottom: '1px solid var(--border)' 
        }}
      >
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <span 
            style={{
              display: 'grid',
              width: '38px',
              height: '38px',
              placeItems: 'center',
              color: 'var(--text-inverse)',
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
              borderRadius: 'var(--radius-md)',
              fontWeight: '800',
              fontSize: '1.25rem',
              fontFamily: 'var(--font-display)',
              boxShadow: '0 4px 10px rgba(37, 99, 235, 0.2)'
            }}
          >
            N
          </span>
          <span 
            style={{ 
              fontSize: '1.35rem', 
              fontWeight: '800', 
              fontFamily: 'var(--font-display)', 
              color: 'var(--text-main)', 
              letterSpacing: '-0.02em' 
            }}
          >
            NGLP
          </span>
        </Link>
        <span 
          style={{
            marginRight: 'auto',
            padding: '2px 8px',
            fontSize: '0.68rem',
            fontWeight: '700',
            backgroundColor: 'var(--surface-raised)',
            color: 'var(--text-muted)',
            borderRadius: '4px',
            textTransform: 'uppercase',
            fontFamily: 'var(--font-mono)'
          }}
        >
          v1.0
        </span>
      </div>

      {/* Navigation Links Area */}
      <nav 
        style={{ 
          flex: 1, 
          padding: '24px 0', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '6px',
          overflowY: 'auto' 
        }}
      >
        {/* Always Visible: الفهرس */}
        <NavLink to="/catalog" style={navLinkStyle}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" style={{ width: '18px', height: '18px' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25A2.25 2.25 0 0 1 13.5 8V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
          </svg>
          <span>الفهرس</span>
        </NavLink>

        {user && (
          <>
            {/* General if logged in: الملف الشخصي */}
            <NavLink to="/profile" style={navLinkStyle}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" style={{ width: '18px', height: '18px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
              <span>الملف الشخصي</span>
            </NavLink>

            {/* Student Only: لوحة الطالب & الكورسات المسجلة */}
            {isStudent && (
              <>
                <NavLink to="/dashboard" end style={navLinkStyle}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" style={{ width: '18px', height: '18px' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.57 50.57 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A57.217 57.217 0 0 1 12 13.5c1.86 0 3.69-.168 5.25-.494V15a.75.75 0 0 0 1.5 0" />
                  </svg>
                  <span>لوحة الطالب</span>
                </NavLink>
                <NavLink to="/dashboard" style={navLinkStyle}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" style={{ width: '18px', height: '18px' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                  </svg>
                  <span>الكورسات المسجلة</span>
                </NavLink>
              </>
            )}

            {/* Teacher Only: كورساتي & إنشاء كورس & إدارة الدروس */}
            {isTeacher && (
              <>
                <NavLink to="/teacher" end style={navLinkStyle}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" style={{ width: '18px', height: '18px' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0h.5m-.5 0h-10.5" />
                  </svg>
                  <span>كورساتي</span>
                </NavLink>
                <NavLink to="/teacher/course-builder" style={navLinkStyle}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" style={{ width: '18px', height: '18px' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  <span>إنشاء كورس</span>
                </NavLink>
                <NavLink to="/teacher/manage-lessons" style={navLinkStyle}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" style={{ width: '18px', height: '18px' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 18V5.625c0-.621.504-1.125 1.125-1.125Z" />
                  </svg>
                  <span>إدارة الدروس</span>
                </NavLink>
              </>
            )}
            {/* Admin Only: لوحة التحكم الشاملة وإدارة التصنيفات */}
            {isAdmin && (
              <>
                <NavLink to="/admin/users" style={navLinkStyle}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" style={{ width: '18px', height: '18px' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
                  </svg>
                  <span>لوحة تحكم المشرف</span>
                </NavLink>
                <NavLink to="/admin/categories" style={navLinkStyle}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" style={{ width: '18px', height: '18px' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 0 1 2.008 1.24l.885 1.77a2.25 2.25 0 0 0 2.007 1.24h1.98a2.25 2.25 0 0 0 2.007-1.24l.885-1.77a2.25 2.25 0 0 1 2.007-1.24h3.86m-18 0h18" />
                  </svg>
                  <span>إدارة التصنيفات</span>
                </NavLink>
              </>
            )}
          </>
        )}
      </nav>

      {/* User Profile / Auth Area (Bottom Section) */}
      <div 
        style={{ 
          padding: '20px 24px', 
          borderTop: '1px solid var(--border)',
          backgroundColor: 'var(--bg)'
        }}
      >
        {user ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* User Greeting Block */}
            <Link 
              to="/profile" 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px',
                textDecoration: 'none',
                padding: '6px',
                borderRadius: 'var(--radius-md)',
                transition: 'background-color var(--transition-fast)',
                maxWidth: '100%'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--surface)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <div 
                style={{ 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '50%', 
                  backgroundColor: 'var(--primary-soft)', 
                  border: '1px solid var(--primary-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                  fontWeight: '800',
                  color: 'var(--primary)',
                  flexShrink: 0
                }}
              >
                {user.fullName ? user.fullName.charAt(0) : 'U'}
              </div>
              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>
                  أهلاً بك 👋
                </span>
                <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.fullName || 'المستخدم'}
                </strong>
              </div>
            </Link>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                minHeight: '38px',
                backgroundColor: 'rgba(239, 68, 68, 0.05)',
                color: 'var(--error)',
                border: '1px solid rgba(239, 68, 68, 0.1)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                e.currentTarget.style.borderColor = 'var(--error)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.05)';
                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.1)';
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" style={{ width: '16px', height: '16px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
              </svg>
              <span>تسجيل الخروج</span>
            </button>

            {/* Delete Account Button */}
            <button
              onClick={() => alert('سيتم حذف الحساب قريباً')}
              style={{
                width: '100%',
                minHeight: '38px',
                backgroundColor: 'transparent',
                color: 'var(--error)',
                border: '1px dashed var(--error)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)';
                e.currentTarget.style.borderStyle = 'solid';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderStyle = 'dashed';
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" style={{ width: '16px', height: '16px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.34 9m-4.72 0-.34-9m9.96-3.243a2.25 2.25 0 0 0-1.854-1.853m-10.83 0a2.25 2.25 0 0 0-1.853 1.853m14.25 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
              <span>حذف الحساب</span>
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Guest Action Stack */}
            <Link 
              to="/login"
              style={{
                width: '100%',
                minHeight: '38px',
                backgroundColor: 'var(--primary)',
                color: 'var(--text-inverse)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                textDecoration: 'none',
                boxShadow: 'var(--shadow-sm)',
                transition: 'all var(--transition-fast)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--primary)'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" style={{ width: '16px', height: '16px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
              </svg>
              <span>تسجيل الدخول</span>
            </Link>

            <Link 
              to="/register"
              style={{
                width: '100%',
                minHeight: '38px',
                backgroundColor: 'var(--surface)',
                color: 'var(--primary)',
                border: '1px solid var(--primary-border)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
                transition: 'all var(--transition-fast)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--primary-soft)';
                e.currentTarget.style.borderColor = 'var(--primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--surface)';
                e.currentTarget.style.borderColor = 'var(--primary-border)';
              }}
            >
              <span>حساب جديد</span>
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
