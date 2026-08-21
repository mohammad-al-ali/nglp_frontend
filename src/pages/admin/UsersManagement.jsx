import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, GraduationCap, Presentation, BookOpen, FolderTree, Ban, ShieldCheck, ShieldAlert, Trash2 } from 'lucide-react';
import api, { getStoredUser } from '../../services/api';
import PageShell from '@/components/ui/page-shell';
import PageHeader from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import StatCard from '@/components/ui/StatCard';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import EmptyState from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';
import { isAdmin } from '@/lib/roles';

const ROLE_LABELS = {
  ROLE_ADMIN: 'مشرف النظام',
  ROLE_TEACHER: 'مدرس المادة',
  ROLE_STUDENT: 'طالب منتسب',
};

const LEVEL_LABELS = {
  BEGINNER: 'مبتدئ',
  INTERMEDIATE: 'متوسط',
  ADVANCED: 'متقدم',
};

export default function UsersManagement() {
  const currentUser = getStoredUser();
  const userIsAdmin = isAdmin(currentUser);

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'courses'
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'user' | 'course', id, label }

  useEffect(() => {
    if (!userIsAdmin) return;

    let isMounted = true;
    async function loadDashboardData() {
      try {
        setLoading(true);
        const [usersRes, rolesRes, coursesRes] = await Promise.all([api.get('/users'), api.get('/roles'), api.get('/courses')]);

        if (isMounted) {
          setUsers(usersRes.data);
          setRoles(rolesRes.data);
          setCourses(coursesRes.data);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load admin dashboard data:', err);
        if (isMounted) {
          setErrorMsg('حدث خطأ أثناء تحميل البيانات من الخادم، يرجى التأكد من تشغيل الخادم.');
          setLoading(false);
        }
      }
    }

    loadDashboardData();
    return () => {
      isMounted = false;
    };
  }, [userIsAdmin]);

  useEffect(() => {
    if (successMsg || errorMsg) {
      const timer = setTimeout(() => {
        setSuccessMsg('');
        setErrorMsg('');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [successMsg, errorMsg]);

  if (!userIsAdmin) {
    return (
      <PageShell>
        <Card className="mx-auto flex max-w-md flex-col items-center gap-4 p-10 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-error-soft text-error">
            <ShieldAlert className="size-7" />
          </div>
          <div>
            <h2 className="font-display text-xl font-semibold text-foreground">وصول غير مصرح به</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              عذراً، هذه الصفحة مخصصة لمدراء النظام فقط. تم تسجيل هذه المحاولة لأغراض الأمان الأكاديمي.
            </p>
          </div>
          <Button as={Link} to="/">
            العودة للرئيسية
          </Button>
        </Card>
      </PageShell>
    );
  }

  const totalUsersCount = users.length;
  const teachersCount = users.filter((u) => String(u.role?.name || u.role || '').toUpperCase().includes('TEACHER')).length;
  const studentsCount = users.filter((u) => String(u.role?.name || u.role || '').toUpperCase().includes('STUDENT')).length;
  const adminsCount = users.filter((u) => String(u.role?.name || u.role || '').toUpperCase().includes('ADMIN')).length;
  const totalCoursesCount = courses.length;

  async function handleUpdateUser(userId, changes) {
    const previousUser = users.find((u) => u.id === userId);
    if (!previousUser) return;

    const updatedUser = { ...previousUser, ...changes };
    setUsers((current) => current.map((u) => (u.id === userId ? updatedUser : u)));

    try {
      await api.put(`/users/${userId}/admin`, {
        role: updatedUser.role,
        blocked: updatedUser.blocked,
      });
      setSuccessMsg('تم تحديث صلاحيات الحساب بنجاح في قاعدة البيانات.');
    } catch (err) {
      console.error('Failed to update user in DB:', err);
      setUsers((current) => current.map((u) => (u.id === userId ? previousUser : u)));
      setErrorMsg('فشل تحديث الحساب بالخلفية. يرجى التحقق من الصلاحيات، والتغيير لم يُحفظ.');
    }
  }

  async function handleConfirmDelete() {
    const { type, id } = deleteTarget;
    try {
      if (type === 'user') {
        await api.delete(`/users/${id}`);
        setUsers((current) => current.filter((u) => u.id !== id));
        setSuccessMsg('تم حذف الحساب نهائياً من قاعدة البيانات.');
      } else {
        await api.delete(`/courses/${id}`);
        setCourses((current) => current.filter((c) => c.id !== id));
        setSuccessMsg('تم حذف الكورس الأكاديمي بنجاح.');
      }
    } catch (err) {
      console.error(`Failed to delete ${type}:`, err);
      setErrorMsg(type === 'user' ? 'تعذر حذف العضو. تأكد من عدم ارتباطه بكورسات أو سجلات نشطة.' : 'تعذر حذف الكورس من قاعدة البيانات.');
    }
  }

  const graphTotal = totalUsersCount || 1;
  const studentPercent = Math.round((studentsCount / graphTotal) * 100);
  const teacherPercent = Math.round((teachersCount / graphTotal) * 100);
  const adminPercent = Math.round((adminsCount / graphTotal) * 100);

  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashStudent = (studentPercent / 100) * circumference;
  const strokeDashTeacher = (teacherPercent / 100) * circumference;
  const strokeDashAdmin = (adminPercent / 100) * circumference;

  return (
    <PageShell>
      <PageHeader
        eyebrow="لوحة التحكم الإشرافية"
        title="لوحة الإدارة والمتابعة الشاملة"
        actions={
          <Button as={Link} to="/admin/categories" variant="outline">
            <FolderTree className="size-4" />
            إدارة التصنيفات الأكاديمية
          </Button>
        }
      />

      {(successMsg || errorMsg) && (
        <div className="mb-6">
          {successMsg && (
            <Alert variant="success">
              <AlertDescription>{successMsg}</AlertDescription>
            </Alert>
          )}
          {errorMsg && (
            <Alert variant="destructive">
              <AlertDescription>{errorMsg}</AlertDescription>
            </Alert>
          )}
        </div>
      )}

      <div className="mb-7 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="إجمالي الأعضاء" value={loading ? '...' : totalUsersCount} icon={Users} tone="primary" />
        <StatCard label="الطلاب الفاعلون" value={loading ? '...' : studentsCount} icon={GraduationCap} tone="success" />
        <StatCard label="أعضاء الهيئة التدريسية" value={loading ? '...' : teachersCount} icon={Presentation} tone="warning" />
        <StatCard label="إجمالي الكورسات المفتوحة" value={loading ? '...' : totalCoursesCount} icon={BookOpen} tone="neutral" />
      </div>

      <Card className="mb-7 grid grid-cols-1 items-center gap-8 p-7 lg:grid-cols-2">
        <div className="flex flex-col items-center justify-center gap-4">
          <h3 className="font-display text-base font-semibold text-foreground">التمثيل البياني لتوزيع الأدوار</h3>

          <div className="relative size-[200px]">
            <svg width="200" height="200" viewBox="0 0 120 120" className="-rotate-90">
              <circle cx="60" cy="60" r={radius} fill="transparent" stroke="var(--color-border)" strokeWidth="12" />
              {studentsCount > 0 && (
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="transparent"
                  stroke="var(--color-success)"
                  strokeWidth="12"
                  strokeDasharray={`${strokeDashStudent} ${circumference}`}
                  className="transition-[stroke-dasharray] duration-1000 ease-out"
                />
              )}
              {teachersCount > 0 && (
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="transparent"
                  stroke="var(--color-warning)"
                  strokeWidth="12"
                  strokeDasharray={`${strokeDashTeacher} ${circumference}`}
                  strokeDashoffset={-strokeDashStudent}
                  className="transition-[stroke-dasharray] duration-1000 ease-out"
                />
              )}
              {adminsCount > 0 && (
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="transparent"
                  stroke="var(--color-primary)"
                  strokeWidth="12"
                  strokeDasharray={`${strokeDashAdmin} ${circumference}`}
                  strokeDashoffset={-(strokeDashStudent + strokeDashTeacher)}
                  className="transition-[stroke-dasharray] duration-1000 ease-out"
                />
              )}
            </svg>

            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
              <span className="block text-xs text-muted-foreground">إجمالي الحسابات</span>
              <strong className="font-display text-2xl font-black text-foreground">{totalUsersCount}</strong>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <h4 className="font-display text-sm font-semibold text-foreground">نسب المشاركة والتمثيل الفعلي</h4>

          <DistributionBar label="الطلاب المنتسبون" percent={studentPercent} count={studentsCount} className="bg-success" />
          <DistributionBar label="الكادر التعليمي" percent={teacherPercent} count={teachersCount} className="bg-warning" />
          <DistributionBar label="مشرفو المنظومة" percent={adminPercent} count={adminsCount} className="bg-primary" />
        </div>
      </Card>

      <div className="mb-5 flex gap-2 border-b border-border">
        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={cn(
            'border-b-2 px-5 py-3 text-sm font-semibold transition-all duration-200 ease-in-out',
            activeTab === 'users' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          إدارة أعضاء المنصة
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('courses')}
          className={cn(
            'border-b-2 px-5 py-3 text-sm font-semibold transition-all duration-200 ease-in-out',
            activeTab === 'courses' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          التحكم في الكورسات الدراسية
        </button>
      </div>

      {activeTab === 'users' && (
        <Card className="overflow-hidden">
          <div className="border-b border-border p-6">
            <h2 className="font-display text-lg font-semibold text-foreground">دليل الأعضاء والمستخدمين الحاليين</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              يتيح لك التحكم الكامل في صلاحيات الحسابات وترقيتها لدور تدريسي أو مشرف، أو تجميد وحظر النشاط نهائياً.
            </p>
          </div>

          {loading ? (
            <div className="flex flex-col gap-3 p-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-12 animate-pulse rounded-md bg-surface-raised" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الاسم الكامل</TableHead>
                  <TableHead>البريد الإلكتروني</TableHead>
                  <TableHead>الدور الأكاديمي</TableHead>
                  <TableHead>حالة الحساب</TableHead>
                  <TableHead className="text-end">إجراءات إدارية</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => {
                  const roleOptions = roles.length > 0 ? roles : user.role ? [user.role] : [];
                  return (
                    <TableRow key={user.id}>
                      <TableCell className="font-semibold text-foreground">{user.fullName}</TableCell>
                      <TableCell className="font-mono text-xs">{user.email}</TableCell>
                      <TableCell>
                        <Select
                          value={user.role?.id || ''}
                          disabled={roleOptions.length === 0}
                          className="h-9 w-40 text-xs"
                          onChange={(event) => {
                            const targetRoleId = Number(event.target.value);
                            const matchingRole = roleOptions.find((r) => r.id === targetRoleId);
                            if (matchingRole) handleUpdateUser(user.id, { role: matchingRole });
                          }}
                        >
                          {roleOptions.map((role) => (
                            <option key={role.id} value={role.id}>
                              {ROLE_LABELS[role.name] || role.name}
                            </option>
                          ))}
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.blocked ? 'destructive' : 'success'}>{user.blocked ? 'محظور مؤقتاً' : 'نشط متصل'}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleUpdateUser(user.id, { blocked: !user.blocked })}>
                            {user.blocked ? <ShieldCheck className="size-3.5" /> : <Ban className="size-3.5" />}
                            {user.blocked ? 'تنشيط الحساب' : 'حظر العضو'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={user.id === currentUser.id}
                            className="border-error-border text-error hover:bg-error-soft"
                            onClick={() => setDeleteTarget({ type: 'user', id: user.id, label: user.fullName })}
                          >
                            <Trash2 className="size-3.5" />
                            حذف نهائي
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Card>
      )}

      {activeTab === 'courses' && (
        <Card className="overflow-hidden">
          <div className="border-b border-border p-6">
            <h2 className="font-display text-lg font-semibold text-foreground">التحكم المباشر في الكورسات الدراسية</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              يتيح لك تصفح ومراقبة كافة المناهج التعليمية المفتوحة بالمنصة بواسطة المدرسين وحذف أي محتوى يخالف الشروط.
            </p>
          </div>

          {loading ? (
            <div className="flex flex-col gap-3 p-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-12 animate-pulse rounded-md bg-surface-raised" />
              ))}
            </div>
          ) : courses.length === 0 ? (
            <EmptyState icon={BookOpen} title="لا توجد كورسات دراسية مسجلة" description="لم يتم إنشاء أي كورس أكاديمي في قاعدة البيانات بعد." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>عنوان الكورس الأكاديمي</TableHead>
                  <TableHead>مدرس المادة</TableHead>
                  <TableHead>القسم / التصنيف</TableHead>
                  <TableHead>مستوى الدورة</TableHead>
                  <TableHead className="text-end">إجراءات إدارية</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell className="font-semibold text-foreground">{course.title || 'كورس غير معنون'}</TableCell>
                    <TableCell>{course.teacher?.fullName || 'مدرس المنصة'}</TableCell>
                    <TableCell className="font-medium text-primary">{course.category?.name || 'تصنيف عام'}</TableCell>
                    <TableCell className="text-muted-foreground">{LEVEL_LABELS[course.level] || 'غير محدد'}</TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-error-border text-error hover:bg-error-soft"
                          onClick={() => setDeleteTarget({ type: 'course', id: course.id, label: course.title })}
                        >
                          <Trash2 className="size-3.5" />
                          حذف الكورس
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={deleteTarget?.type === 'user' ? 'حذف العضو' : 'حذف الكورس'}
        description={
          deleteTarget?.type === 'user'
            ? `هل أنت متأكد من حذف حساب "${deleteTarget?.label}" نهائياً؟ لا يمكن التراجع عن هذا الإجراء.`
            : `هل أنت متأكد من حذف كورس "${deleteTarget?.label}" نهائياً؟ لا يمكن التراجع عن هذا الإجراء.`
        }
        confirmLabel="حذف"
        destructive
        onConfirm={handleConfirmDelete}
      />
    </PageShell>
  );
}

function DistributionBar({ label, percent, count, className }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between text-sm">
        <span className="font-semibold text-foreground">{label}</span>
        <span className="font-bold text-muted-foreground">
          {percent}% ({count})
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-raised">
        <div className={cn('h-full rounded-full transition-[width] duration-1000 ease-out', className)} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
