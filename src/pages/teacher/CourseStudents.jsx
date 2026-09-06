import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowRight, Users, TrendingUp, AlertTriangle, Unplug } from 'lucide-react';
import api from '../../services/api';
import PageShell from '@/components/ui/page-shell';
import PageHeader from '@/components/ui/page-header';
import StatCard from '@/components/ui/StatCard';
import Skeleton from '@/components/ui/Skeleton';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import EmptyState from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';
import { normalizeRoster, timeAgo } from '../../utils/constants';

const LTR = 'inline-block [direction:ltr]';

export default function CourseStudents() {
  const { courseId } = useParams();
  const [roster, setRoster] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    let mounted = true;
    api
      .get(`/courses/${courseId}/roster`)
      .then((response) => {
        if (!mounted) return;
        setRoster(normalizeRoster(response.data));
        setStatus('ready');
      })
      .catch((err) => {
        if (!mounted) return;
        setErrorMessage(err.friendlyMessage || 'تعذّر تحميل قائمة طلاب هذا الكورس.');
        setStatus('error');
      });
    return () => {
      mounted = false;
    };
  }, [courseId]);

  return (
    <PageShell>
      <PageHeader
        eyebrow="مساحة العمل للمعلم"
        title={roster?.courseTitle || 'طلاب الكورس'}
        actions={
          <Link
            to="/teacher"
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-surface-raised px-3 text-sm font-bold text-foreground"
          >
            <ArrowRight className="size-4" /> رجوع
          </Link>
        }
      />

      {status === 'loading' && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-28 animate-pulse rounded-lg bg-surface-raised" />
            ))}
          </div>
          <Skeleton count={5} height="64px" />
        </div>
      )}

      {status === 'error' && (
        <EmptyState icon={Unplug} title="تعذّر التحميل" description={errorMessage} />
      )}

      {status === 'ready' && roster && (
        <div className="flex flex-col gap-8">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <StatCard label="عدد الطلاب" value={roster.studentsCount} icon={Users} tone="primary" />
            <StatCard
              label="متوسط الإنجاز"
              value={<span className={LTR}>{roster.avgCompletionPercent}%</span>}
              icon={TrendingUp}
              tone="neutral"
            />
            <StatCard
              label="بحاجة للمتابعة"
              value={roster.atRiskCount}
              icon={AlertTriangle}
              tone={roster.atRiskCount > 0 ? 'warning' : 'neutral'}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            علامة "بحاجة للمتابعة" مبنيّة على نشاط الدروس فقط (لا تشمل الاختبارات أو المساعد الذكي).
          </p>

          {roster.students.length === 0 ? (
            <EmptyState
              icon={Users}
              title="لا يوجد طلاب مسجَّلون بعد"
              description="سيظهر الطلاب هنا فور تسجيلهم في هذا الكورس."
            />
          ) : (
            <div className="flex flex-col gap-3">
              {roster.students.map((student) => (
                <Card
                  key={student.userId}
                  className={cn(
                    'flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-5',
                    student.atRisk && 'border-warning-border bg-warning-soft/30'
                  )}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    {student.avatarUrl ? (
                      <img src={student.avatarUrl} alt="" className="size-10 shrink-0 rounded-full object-cover" />
                    ) : (
                      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-surface-raised text-sm font-bold text-muted-foreground">
                        {student.fullName.charAt(0)}
                      </span>
                    )}
                    <div className="min-w-0">
                      <strong className="block truncate text-sm font-semibold text-foreground">
                        {student.fullName}
                      </strong>
                      <span className="text-xs text-muted-foreground">
                        {student.lastActivityAt
                          ? `آخر نشاط ${timeAgo(student.lastActivityAt)}`
                          : `مسجَّل ${timeAgo(student.enrolledAt)}`}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 sm:w-56">
                    <div className="flex justify-between text-xs font-semibold text-foreground">
                      <span className={LTR}>
                        {student.completedLessons}/{student.totalLessons} دروس
                      </span>
                      <span className={cn('text-primary', LTR)}>{student.progressPercent}%</span>
                    </div>
                    <Progress value={student.progressPercent} />
                  </div>

                  {student.atRisk && (
                    <Badge variant="warning" className="shrink-0 self-start whitespace-nowrap sm:self-center">
                      {student.atRiskReason}
                    </Badge>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </PageShell>
  );
}
