import { Navigate } from 'react-router-dom';
import { getStoredUser } from '../services/api';
import { isAdmin, isTeacher, isStudent } from '../lib/roles';

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

  // Map to the allowed IDs
  let userRoleId = null;
  if (isAdmin(user)) userRoleId = ROLE_ADMIN;
  else if (isTeacher(user)) userRoleId = ROLE_TEACHER;
  else if (isStudent(user)) userRoleId = ROLE_STUDENT;

  // Fallback to direct id checks if not matched by string
  if (userRoleId === null) {
    userRoleId = user.role?.id ?? user.roleId ?? null;
  }

  if (!allowedRoles.includes(userRoleId)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
