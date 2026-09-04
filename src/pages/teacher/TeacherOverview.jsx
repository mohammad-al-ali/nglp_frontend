import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, BookOpen, GraduationCap, Unplug, Users, FolderOpen, Zap } from 'lucide-react';
import api, { getCurrentUserId } from '../../services/api';
import PageShell from '@/components/ui/page-shell';
import PageHeader from '@/components/ui/page-header';
import StatCard from '@/components/ui/StatCard';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/ui/empty-state';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { normalizeCourse } from '../../utils/constants';

export default function TeacherOverview() {
  const [teacherCourses, setTeacherCourses] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, title } | null
  const [deleteError, setDeleteError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    api.get('/courses', { params: { teacherId: getCurrentUserId() } })
      .then((response) => {
        if (isMounted) {
          setTeacherCourses(response.data.map(normalizeCourse));
          setStatus('ready');
        }
      })
      .catch((err) => {
        console.warn('Failed to load teacher courses from backend.', err);
        if (isMounted) setStatus('error');
      });
    return () => {
      isMounted = false;
    };
  }, []);

  async function handleConfirmDelete() {
    try {
      await api.delete(`/courses/${deleteTarget.id}`);
      setTeacherCourses((current) => current.filter((c) => c.id !== deleteTarget.id));
      setDeleteError(null);
    } catch (err) {
      console.warn('Failed to delete course from backend.', err);
      setDeleteError(err.friendlyMessage || `تعذّر حذف الكورس "${deleteTarget.title}".`);
    }
  }

  const totalLessons = teacherCourses.reduce((total, c) => total + c.lessonsCount, 0);
  const totalStudents = teacherCourses.reduce((total, c) => total + (c.students || 0), 0);

  return (
    <PageShell>
      <PageHeader
        eyebrow="مساحة العمل للمعلم"
        title="نظرة عامة على الكورسات"
        actions={
          <Button as={Link} to="/teacher/course-builder">
            <Plus className="size-4" />
            إنشاء كورس جديد
          </Button>
        }
      />

      <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
        <StatCard label="الكورسات المنشأة" value={teacherCourses.length} />
        <StatCard label="الدروس المنشورة" value={totalLessons} />
        <StatCard label="الطلاب النشطين" value={`${totalStudents.toLocaleString('en-US')} طالب`} />
      </div>

      {deleteError && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{deleteError}</AlertDescription>
        </Alert>
      )}

      <h3 className="mb-5 flex items-center gap-2 font-display text-xl font-semibold text-foreground">
        <BookOpen className="size-5 text-muted-foreground" />
        قائمة كورساتك التعليمية ({teacherCourses.length})
      </h3>

      {status === 'loading' ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2].map((n) => (
            <div key={n} className="h-72 animate-pulse rounded-lg bg-surface-raised" />
          ))}
        </div>
      ) : status === 'error' ? (
        <EmptyState
          icon={Unplug}
          title="تعذر تحميل كورساتك"
          description="حدث خطأ أثناء الاتصال بالخادم. يرجى تحديث الصفحة أو المحاولة مرة أخرى لاحقاً."
        />
      ) : teacherCourses.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="لم تقم بإنشاء أي كورس بعد"
          description={'اضغط على زر "إنشاء كورس جديد" بالأعلى لبدء إعداد منهجك الدراسي الأول!'}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {teacherCourses.map((course) => (
            <Card key={course.id} className="flex flex-col gap-4 p-6">
              <div className="flex items-center justify-between">
                <Badge>{course.category}</Badge>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="size-3.5" />
                  {course.students} طالب
                </span>
              </div>

              <div className="flex-1">
                <h4 className="font-display text-base font-semibold leading-snug text-foreground">{course.title}</h4>
                <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{course.description}</p>
              </div>

              <div className="flex gap-4 border-y border-border py-2.5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <FolderOpen className="size-3.5" />
                  {course.lessonsCount} درس
                </span>
                <span className="flex items-center gap-1">
                  <Zap className="size-3.5" />
                  {course.level}
                </span>
              </div>

              <div className="flex flex-col gap-2.5">
                <Button as={Link} to={`/teacher/manage-lessons/${course.id}`}>
                  إدارة الدروس
                </Button>
                <div className="grid grid-cols-2 gap-2.5">
                  <Button as={Link} to={`/teacher/manage-course/${course.id}`} variant="outline" size="sm">
                    تعديل الكورس
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-error-border text-error hover:bg-error-soft"
                    onClick={() => setDeleteTarget({ id: course.id, title: course.title })}
                  >
                    حذف الكورس
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="حذف الكورس"
        description={deleteTarget ? `هل أنت متأكد من رغبتك في حذف الكورس "${deleteTarget.title}"؟ لا يمكن حذف كورس يحتوي على دروس أو طلاب مسجّلين — احذف الدروس وأزل التسجيلات أولاً.` : ''}
        confirmLabel="حذف"
        destructive
        onConfirm={handleConfirmDelete}
      />
    </PageShell>
  );
}
