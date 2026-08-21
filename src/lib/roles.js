/**
 * Single source for role checks. Was copy-pasted verbatim in
 * RoleRoute, Sidebar, CategoriesManager, and UsersManagement.
 * Accepts either shape the backend/localStorage ever produces:
 * a Role object ({ name: 'ROLE_TEACHER' }) or a plain string.
 */
function roleName(user) {
  return String(user?.role?.name || user?.role || '').toUpperCase();
}

export function isAdmin(user) {
  return roleName(user).includes('ADMIN');
}

export function isTeacher(user) {
  return roleName(user).includes('TEACHER');
}

export function isStudent(user) {
  return roleName(user).includes('STUDENT');
}
