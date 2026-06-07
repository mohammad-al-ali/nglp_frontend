import { Navigate } from 'react-router-dom';
import { getStoredUser } from '../services/api';

export const ROLE_ADMIN = 1;
export const ROLE_STUDENT = 2;
export const ROLE_TEACHER = 3;

/**
 * Route protection wrapper component based on user roles
 */
export default function RoleRoute({ allowedRoles, children }) {
  const user = getStoredUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Robust check matching Sidebar.jsx
  const roleStr = String(user?.role?.name || user?.role || '').toUpperCase();
  const isTeacher = roleStr.includes('TEACHER');
  const isStudent = roleStr.includes('STUDENT');
  const isAdmin = roleStr.includes('ADMIN');

  // Map to the allowed IDs
  let userRoleId = null;
  if (isAdmin) userRoleId = ROLE_ADMIN;
  else if (isTeacher) userRoleId = ROLE_TEACHER;
  else if (isStudent) userRoleId = ROLE_STUDENT;

  // Fallback to direct id checks if not matched by string
  if (userRoleId === null) {
    userRoleId = user.role?.id ?? user.roleId ?? null;
  }

  if (!allowedRoles.includes(userRoleId)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
