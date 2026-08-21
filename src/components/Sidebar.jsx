import { NavLink, Link } from 'react-router-dom';
import { LayoutGrid, User, GraduationCap, BookOpen, Plus, ListChecks, Users, FolderTree, LogOut, LogIn, UserPlus } from 'lucide-react';
import { getStoredUser } from '../services/api';
import { resolveMediaUrl } from '../utils/constants';
import { isAdmin, isTeacher, isStudent } from '@/lib/roles';
import { cn } from '@/lib/utils';

const navLinkClass = ({ isActive }) =>
  cn(
    'me-3 flex items-center gap-3 rounded-e-md border-s-4 px-5 py-3 text-sm transition-all duration-200 ease-in-out',
    isActive
      ? 'border-primary bg-primary-soft font-bold text-primary'
      : 'border-transparent font-medium text-muted-foreground hover:bg-surface-raised hover:text-foreground'
  );

export default function Sidebar() {
  const user = getStoredUser();
  const userIsTeacher = isTeacher(user);
  const userIsStudent = isStudent(user);
  const userIsAdmin = isAdmin(user);

  function handleLogout() {
    localStorage.clear();
    window.location.href = '/login';
  }

  return (
    <aside
      style={{ width: 'var(--sidebar-width)' }}
      className="fixed inset-y-0 start-0 z-40 flex flex-col border-e border-border bg-surface font-sans shadow-soft"
    >
      <div className="flex h-20 items-center border-b border-border px-6">
        <Link to="/" className="flex items-center gap-2.5 no-underline">
          <span className="grid size-9 place-items-center rounded-md bg-primary font-display text-xl font-extrabold text-primary-foreground shadow-soft">
            N
          </span>
          <span className="font-display text-2xl font-extrabold tracking-tight text-foreground">NGLP</span>
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-1.5 overflow-y-auto py-6">
        <NavLink to="/catalog" className={navLinkClass}>
          <LayoutGrid className="size-4" />
          <span>الرئيسية</span>
        </NavLink>

        {user && (
          <>
            <NavLink to="/profile" className={navLinkClass}>
              <User className="size-4" />
              <span>الملف الشخصي</span>
            </NavLink>

            {userIsStudent && (
              <NavLink to="/dashboard" className={navLinkClass}>
                <GraduationCap className="size-4" />
                <span>لوحة الطالب</span>
              </NavLink>
            )}

            {userIsTeacher && (
              <>
                <NavLink to="/teacher" end className={navLinkClass}>
                  <BookOpen className="size-4" />
                  <span>كورساتي</span>
                </NavLink>
                <NavLink to="/teacher/course-builder" className={navLinkClass}>
                  <Plus className="size-4" />
                  <span>إنشاء كورس</span>
                </NavLink>
                <NavLink to="/teacher/manage-lessons" className={navLinkClass}>
                  <ListChecks className="size-4" />
                  <span>إدارة الدروس</span>
                </NavLink>
              </>
            )}

            {userIsAdmin && (
              <>
                <NavLink to="/admin/users" className={navLinkClass}>
                  <Users className="size-4" />
                  <span>لوحة تحكم المشرف</span>
                </NavLink>
                <NavLink to="/admin/categories" className={navLinkClass}>
                  <FolderTree className="size-4" />
                  <span>إدارة التصنيفات</span>
                </NavLink>
              </>
            )}
          </>
        )}
      </nav>

      <div className="border-t border-border p-5">
        {user ? (
          <div className="flex flex-col gap-3">
            <Link to="/profile" className="flex max-w-full items-center gap-3 rounded-md p-1.5 transition-all duration-200 ease-in-out hover:bg-surface-raised">
              <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-primary-border bg-primary-soft font-bold text-primary">
                {user.avatarUrl ? (
                  <img src={resolveMediaUrl(user.avatarUrl)} alt="" className="size-full object-cover" />
                ) : (
                  user.fullName?.charAt(0) || 'U'
                )}
              </div>
              <div className="overflow-hidden">
                <span className="block text-xs text-muted-foreground">أهلاً بك</span>
                <strong className="block truncate text-sm text-foreground">{user.fullName || 'المستخدم'}</strong>
              </div>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-md border border-error-border bg-error-soft text-sm font-bold text-error transition-all duration-200 ease-in-out hover:bg-error/10"
            >
              <LogOut className="size-4" />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Link
              to="/login"
              className="flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary text-sm font-bold text-primary-foreground shadow-soft transition-all duration-200 ease-in-out hover:bg-primary-hover"
            >
              <LogIn className="size-4" />
              <span>تسجيل الدخول</span>
            </Link>

            <Link
              to="/register"
              className="flex h-10 w-full items-center justify-center gap-2 rounded-md border border-primary-border bg-surface text-sm font-bold text-primary transition-all duration-200 ease-in-out hover:bg-primary-soft"
            >
              <UserPlus className="size-4" />
              <span>حساب جديد</span>
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
