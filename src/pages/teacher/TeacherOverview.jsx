import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  BookOpen,
  GraduationCap,
  Unplug,
  Users,
  TrendingUp,
  FileQuestion,
  AlertTriangle,
  CheckCircle2,
  UserPlus,
} from 'lucide-react';
import api, { getCurrentUserId } from '../../services/api';
import PageShell from '@/components/ui/page-shell';
import PageHeader from '@/components/ui/page-header';
import StatCard from '@/components/ui/StatCard';
import Skeleton from '@/components/ui/Skeleton';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import EmptyState from '@/components/ui/empty-state';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { normalizeTeacherDashboard, timeAgo } from '../../utils/constants';

const ACTIVITY_META = {
  LESSON_COMPLETED: { icon: CheckCircle2, tone: 'bg-success-soft text-success' },
  QUIZ_SUBMITTED: { icon: FileQuestion, tone: 'bg-info-soft text-info' },
  ENROLLED: { icon: UserPlus, tone: 'bg-primary-soft text-primary' },
};

const LTR = 'inline-block [direction:ltr]';

export default function TeacherOverview() {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  const fetchDashboard = useCallback(() => {
    api
      .get(`/teachers/${getCurrentUserId()}/dashboard`)
      .then((response) => {
        setData(normalizeTeacherDashboard(response.data));
        setStatus('ready');
      })
      .catch((err) => {
        console.warn('Failed to load teacher dashboard.', err);
        setStatus('error');
      });
  }, []);

  useEffect(fetchDashboard, [fetchDashboard]);

  async function handleConfirmDelete() {
    try {
      await api.delete(`/courses/${deleteTarget.id}`);
      setDeleteError(null);
      fetchDashboard();
    } catch (err) {
      console.warn('Failed to delete course.', err);
      setDeleteError(err.friendlyMessage || `تعذّر حذف الكورس "${deleteTarget.title}".`);
    }
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="مساحة العمل للمعلم"
        title="نظرة عامة"
        actions={
          <Button as={Link} to="/teacher/course-builder">
            <Plus className="size-4" />
            إنشاء كورس جديد
          </Button>
        }
      />

      {status === 'loading' && <DashboardSkeleton />}

      {status === 'error' && (
        <EmptyState
          icon={Unplug}
          title="تعذر تحميل لوحة المعلم"
          description="حدث خطأ أثناء الاتصال بالخادم. يرجى تحديث الصفحة أو المحاولة مرة أخرى لاحقاً."
        />
      )}

      {status === 'ready' && data && (
        <DashboardBody
          data={data}
          deleteError={deleteError}
          onAskDelete={(course) => setDeleteTarget({ id: course.courseId, title: course.title })}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="حذف الكورس"
        description={
          deleteTarget
            ? `هل أنت متأكد من حذف الكورس "${deleteTarget.title}"؟ لا يمكن حذف كورس يحتوي على دروس أو طلاب مسجّلين.`
            : ''
        }
        confirmLabel="حذف"
        destructive
        onConfirm={handleConfirmDelete}
      />
    </PageShell>
  );
}

function DashboardBody({ data, deleteError, onAskDelete }) {
  const { summary, courses, recentActivity } = data;

  return (
    <div className="flex flex-col gap-9">
      {deleteError && (
        <Alert variant="destructive">
          <AlertDescription>{deleteError}</AlertDescription>
        </Alert>
      )}

      {/* ── الإحصاءات ── */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="الكورسات المنشأة" value={summary.coursesCount} icon={BookOpen} tone="primary" />
        <StatCard label="إجمالي الطلاب" value={summary.totalStudents} icon={Users} tone="success" />
        <StatCard
          label="متوسط إنجاز الطلاب"
          value={<span className={LTR}>{summary.avgCompletionPercent}%</span>}
          icon={TrendingUp}
          tone="neutral"
        />
        <StatCard label="اختبارات منشورة" value={summary.quizzesPublished} icon={FileQuestion} tone="neutral" />
      </div>

      {/* ── طلاب بحاجة للمتابعة ── */}
      {summary.atRiskStudentsCount > 0 && (
        <Alert variant="warning">
          <AlertTriangle />
          <AlertDescription>
            لديك <strong className={LTR}>{summary.atRiskStudentsCount}</strong> طالب بحاجة للمتابعة — لم
            يبدؤوا أو توقّف نشاطهم. افتح "الطلاب" في كل كورس لرؤية التفاصيل.
          </AlertDescription>
        </Alert>
      )}

      {/* ── الكورسات ── */}
      <section>
        <h3 className="mb-5 flex items-center gap-2 font-display text-xl font-semibold text-foreground">
          <BookOpen className="size-5 text-muted-foreground" />
          كورساتك التعليمية ({courses.length})
        </h3>

        {courses.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title="لم تُنشئ أي كورس بعد"
            description={'اضغط "إنشاء كورس جديد" بالأعلى لبدء إعداد منهجك الأول.'}
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <Card key={course.courseId} className="flex flex-col gap-4 p-6">
                <div className="flex items-center justify-between">
                  <Badge>{course.category}</Badge>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="size-3.5" />
                    <span className={LTR}>{course.studentsCount}</span> طالب
                  </span>
                </div>

                <h4 className="font-display text-base font-semibold leading-snug text-foreground">
                  {course.title}
                </h4>

                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-xs font-semibold text-foreground">
                    <span>متوسط إنجاز الطلاب</span>
                    <span className={cn('text-primary', LTR)}>{course.avgCompletionPercent}%</span>
                  </div>
                  <Progress value={course.avgCompletionPercent} />
                </div>

                <div className="flex flex-wrap gap-3 border-y border-border py-2.5 text-xs text-muted-foreground">
                  <span className={LTR}>{course.lessonsCount} درس</span>
                  {course.atRiskCount > 0 && (
                    <span className="flex items-center gap-1 font-semibold text-warning">
                      <AlertTriangle className="size-3.5" />
                      <span className={LTR}>{course.atRiskCount}</span> بحاجة للمتابعة
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-2.5">
                  <Button as={Link} to={`/teacher/course/${course.courseId}/students`}>
                    <Users className="size-4" /> الطلاب
                  </Button>
                  <div className="grid grid-cols-3 gap-2">
                    <Button as={Link} to={`/teacher/manage-lessons/${course.courseId}`} variant="outline" size="sm">
                      الدروس
                    </Button>
                    <Button as={Link} to={`/teacher/manage-course/${course.courseId}`} variant="outline" size="sm">
                      تعديل
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-error-border text-error hover:bg-error-soft"
                      onClick={() => onAskDelete(course)}
                    >
                      حذف
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* ── النشاط الأخير ── */}
      {courses.length > 0 && (
        <Card className="p-6">
          <h3 className="mb-4 font-display text-lg font-semibold text-foreground">نشاط الطلاب الأخير</h3>
          {recentActivity.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              لا يوجد نشاط بعد. سيظهر هنا عند بدء طلابك بالتعلّم.
            </p>
          ) : (
            <ol className="flex flex-col gap-1 border-s border-border ps-4">
              {recentActivity.map((item, i) => {
                const meta = ACTIVITY_META[item.type] || ACTIVITY_META.ENROLLED;
                const Icon = meta.icon;
                const body = (
                  <div className="flex items-start gap-3 rounded-md px-2 py-2 transition-colors hover:bg-surface-raised">
                    <span className={cn('mt-0.5 grid size-7 shrink-0 place-items-center rounded-full', meta.tone)}>
                      <Icon className="size-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {item.studentName && <span className="text-primary">{item.studentName} · </span>}
                        {item.title}
                      </p>
                      {item.courseTitle && (
                        <p className="truncate text-xs text-muted-foreground">{item.courseTitle}</p>
                      )}
                    </div>
                    <span className={cn('shrink-0 text-xs text-muted-foreground', LTR)}>
                      {timeAgo(item.timestamp)}
                    </span>
                  </div>
                );
                return (
                  <li key={i}>
                    {item.link ? (
                      <Link to={item.link} className="block">
                        {body}
                      </Link>
                    ) : (
                      body
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </Card>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-9">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="h-28 animate-pulse rounded-lg bg-surface-raised" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((n) => (
          <div key={n} className="h-64 animate-pulse rounded-lg bg-surface-raised" />
        ))}
      </div>
      <Skeleton count={4} height="44px" />
    </div>
  );
}
