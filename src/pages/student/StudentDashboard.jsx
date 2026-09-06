import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Unplug,
  BookOpen,
  CheckCircle2,
  ListChecks,
  Clock,
  FileQuestion,
  Sparkles,
  TrendingUp,
  MessageCircleQuestion,
  Plus,
} from 'lucide-react';
import api, { getCurrentUserId } from '../../services/api';
import PageShell from '@/components/ui/page-shell';
import PageHeader from '@/components/ui/page-header';
import StatCard from '@/components/ui/StatCard';
import ProgressRing from '@/components/ui/progress-ring';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import EmptyState from '@/components/ui/empty-state';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import { cn } from '@/lib/utils';
import { notify } from '@/lib/toast';
import { SUCCESS } from '@/lib/messages';
import { normalizeDashboard, formatLearningTime, timeAgo } from '../../utils/constants';

const ACTIVITY_META = {
  LESSON_COMPLETED: { icon: CheckCircle2, tone: 'bg-success-soft text-success', label: 'أكملت درساً' },
  QUIZ_SUBMITTED: { icon: FileQuestion, tone: 'bg-info-soft text-info', label: 'اختبار' },
  AI_SESSION: { icon: Sparkles, tone: 'bg-primary-soft text-primary', label: 'المساعد الذكي' },
  ENROLLED: { icon: BookOpen, tone: 'bg-surface-raised text-muted-foreground', label: 'تسجيل جديد' },
};

const LTR = 'inline-block [direction:ltr]';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [withdrawTarget, setWithdrawTarget] = useState(null); // { courseId, title } | null

  const userId = getCurrentUserId();

  const fetchDashboard = useCallback(() => {
    if (!userId) {
      navigate('/login');
      return;
    }
    api
      .get(`/students/${userId}/dashboard`)
      .then((response) => {
        setData(normalizeDashboard(response.data));
        setStatus('ready');
      })
      .catch((err) => {
        console.warn('Failed to load student dashboard.', err);
        setStatus('error');
      });
  }, [userId, navigate]);

  useEffect(fetchDashboard, [fetchDashboard]);

  async function handleContinueLearning(courseId, lastWatchedLessonId) {
    if (lastWatchedLessonId) {
      navigate(`/study-room/${courseId}/lesson/${lastWatchedLessonId}`);
      return;
    }
    try {
      const response = await api.get('/lessons', { params: { courseId } });
      const firstLessonId = response.data?.[0]?.id;
      navigate(`/study-room/${courseId}/lesson/${firstLessonId || 1}`);
    } catch {
      navigate(`/study-room/${courseId}/lesson/1`);
    }
  }

  async function handleWithdraw(courseId) {
    try {
      await api.delete('/enrollments', { params: { userId, courseId } });
      notify.success(SUCCESS.UNENROLLED);
      setWithdrawTarget(null);
      fetchDashboard();
    } catch (e) {
      notify.error(e?.friendlyMessage || 'تعذر إلغاء التسجيل، حاول مجدداً');
    }
  }

  async function handleQuickEnroll(courseId) {
    try {
      await api.post('/enrollments', null, { params: { userId, courseId } });
      notify.success('تم تسجيلك في الكورس بنجاح');
      fetchDashboard();
    } catch (e) {
      notify.error(e?.friendlyMessage || 'تعذر التسجيل، حاول مجدداً');
    }
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="مساحة الطالب التعليمية"
        title="لوحة المتابعة"
        actions={
          <Button as={Link} to="/profile" variant="outline">
            الملف الشخصي
          </Button>
        }
      />

      {status === 'loading' && <DashboardSkeleton />}

      {status === 'error' && (
        <EmptyState
          icon={Unplug}
          title="تعذر تحميل لوحة المتابعة"
          description="حدث خطأ أثناء الاتصال بالخادم. يرجى تحديث الصفحة أو المحاولة مرة أخرى لاحقاً."
        />
      )}

      {status === 'ready' && data && (
        <DashboardBody
          data={data}
          onContinue={handleContinueLearning}
          onQuickEnroll={handleQuickEnroll}
          onWithdraw={(courseId, title) => setWithdrawTarget({ courseId, title })}
        />
      )}

      <ConfirmDialog
        open={withdrawTarget !== null}
        onOpenChange={(open) => !open && setWithdrawTarget(null)}
        destructive
        title="إلغاء التسجيل في الكورس"
        description={
          withdrawTarget
            ? `سيتم حذف تقدّمك في دروس «${withdrawTarget.title}». يمكنك التسجيل مجدداً لاحقاً لكن سيبدأ تقدّمك من الصفر.`
            : ''
        }
        confirmLabel="نعم، ألغِ التسجيل"
        onConfirm={() => handleWithdraw(withdrawTarget.courseId)}
      />
    </PageShell>
  );
}

function DashboardBody({ data, onContinue, onQuickEnroll, onWithdraw }) {
  const { summary, resumeLearning, courses, recentActivity, quizPerformance, recommendations } = data;
  const isEmpty = summary.enrolledCount === 0;

  return (
    <div className="flex flex-col gap-9">
      {/* ── بطاقة استئناف التعلم + حلقة التقدّم ── */}
      {!isEmpty && (
        <Card className="flex flex-col items-center gap-6 p-6 sm:flex-row sm:gap-8 sm:p-8">
          <ProgressRing value={summary.overallProgressPercent} size={132}>
            <strong className="font-display text-3xl font-black text-foreground">
              {summary.overallProgressPercent}%
            </strong>
            <span className="text-[11px] font-semibold text-muted-foreground">إنجازك العام</span>
          </ProgressRing>

          <div className="flex-1 text-center sm:text-start">
            <p className="mb-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-primary">
              استئناف التعلم
            </p>
            {resumeLearning ? (
              <>
                <h2 className="font-display text-xl font-semibold text-foreground">
                  {resumeLearning.lessonTitle}
                </h2>
                <p className="mt-1 text-sm font-medium text-muted-foreground">
                  المنهج: {resumeLearning.courseTitle} · <span className={LTR}>{resumeLearning.coursePercent}%</span>
                </p>
                <Button
                  className="mt-4"
                  size="lg"
                  onClick={() => onContinue(resumeLearning.courseId, resumeLearning.lessonId)}
                >
                  استئناف الدرس الآن
                </Button>
              </>
            ) : (
              <>
                <h2 className="font-display text-xl font-semibold text-foreground">أكملت كل دروسك 🎉</h2>
                <p className="mt-1 text-sm font-medium text-muted-foreground">
                  استكشف كورساً جديداً من الاقتراحات بالأسفل.
                </p>
              </>
            )}
          </div>
        </Card>
      )}

      {/* ── شبكة الإحصاءات ── */}
      {!isEmpty && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="الكورسات المسجلة" value={summary.enrolledCount} icon={BookOpen} tone="primary" />
          <StatCard label="كورسات مكتملة" value={summary.completedCount} icon={CheckCircle2} tone="success" />
          <StatCard
            label="الدروس المكتملة"
            value={<span className={LTR}>{summary.lessonsCompleted}/{summary.totalLessons}</span>}
            icon={ListChecks}
            tone="neutral"
          />
          <StatCard
            label="وقت التعلم"
            value={formatLearningTime(summary.totalWatchTimeSeconds)}
            icon={Clock}
            tone="warning"
          />
          <StatCard label="اختبارات مُنجزة" value={summary.quizzesTaken} icon={FileQuestion} tone="neutral" />
          <StatCard
            label="متوسط الدرجات"
            value={<span className={LTR}>{summary.avgQuizScorePercent}%</span>}
            icon={TrendingUp}
            tone="success"
          />
          <StatCard label="أسئلة للمساعد" value={summary.aiQuestionsAsked} icon={MessageCircleQuestion} tone="primary" />
          <StatCard label="جلسات تعلّم بالـ AI" value={summary.aiSessions} icon={Sparkles} tone="neutral" />
        </div>
      )}

      {/* ── الكورسات المسجّلة ── */}
      {isEmpty ? (
        <EmptyState
          icon={GraduationCap}
          title="لم تسجل في أي كورس بعد"
          description="ابدأ رحلتك التعليمية الآن — تصفّح دليل الكورسات أو اختر من الاقتراحات بالأسفل."
          action={
            <Button as={Link} to="/catalog" className="mt-1">
              تصفح دليل الكورسات
            </Button>
          }
        />
      ) : (
        <section>
          <h3 className="mb-5 font-display text-xl font-semibold text-foreground">
            كورساتك التعليمية المسجلة ({courses.length})
          </h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <Card key={course.courseId} className="flex flex-col justify-between gap-5 p-6">
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <Badge>{course.category}</Badge>
                    <span className={cn('text-xs font-semibold text-muted-foreground', LTR)}>
                      {course.completedLessons}/{course.totalLessons} دروس
                    </span>
                  </div>
                  <h3 className="font-display text-lg font-semibold leading-snug text-foreground">{course.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                    {course.description}
                  </p>
                </div>

                <div>
                  <div className="mb-4 flex flex-col gap-2">
                    <div className="flex justify-between text-xs font-semibold text-foreground">
                      <span>نسبة الإنجاز</span>
                      <span className={cn('text-primary', LTR)}>{course.progressPercent}%</span>
                    </div>
                    <Progress value={course.progressPercent} />
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <Button size="sm" onClick={() => onContinue(course.courseId, course.lastWatchedLessonId)}>
                      متابعة التعلم
                    </Button>
                    <Button as={Link} to={`/catalog/${course.courseId}`} variant="outline" size="sm">
                      تفاصيل المنهج
                    </Button>
                  </div>
                  <button
                    type="button"
                    onClick={() => onWithdraw(course.courseId, course.title)}
                    className="mt-2.5 flex w-full items-center justify-center gap-1.5 text-xs font-semibold text-error underline-offset-4 hover:underline"
                  >
                    <Unplug className="size-3.5" />
                    إلغاء التسجيل
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* ── النشاط الأخير + أداء الاختبارات ── */}
      {!isEmpty && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
          <Card className="p-6">
            <h3 className="mb-4 font-display text-lg font-semibold text-foreground">النشاط الأخير</h3>
            {recentActivity.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                لا يوجد نشاط بعد. ابدأ درساً لتظهر خطواتك هنا.
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
                        <p className="truncate text-sm font-semibold text-foreground">{item.title}</p>
                        {/* عنوان الكورس مكرر بالفعل داخل نص "التحقت بكورس ..." */}
                        {item.courseTitle && item.type !== 'ENROLLED' && (
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

          <Card className="p-6">
            <h3 className="mb-4 font-display text-lg font-semibold text-foreground">أداؤك في الاختبارات</h3>
            {quizPerformance.totalAttempts === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">لم تُنجز أي اختبار بعد.</p>
            ) : (
              <>
                <div className="mb-5 flex items-end gap-2">
                  <strong className={cn('font-display text-4xl font-black text-foreground', LTR)}>
                    {quizPerformance.avgScorePercent}%
                  </strong>
                  <span className="pb-1 text-xs text-muted-foreground">
                    متوسط الدرجات عبر <span className={LTR}>{quizPerformance.totalAttempts}</span> اختبار
                  </span>
                </div>
                <Progress value={quizPerformance.avgScorePercent} />

                <div className="mt-5 flex flex-col gap-3">
                  {quizPerformance.recent.map((r, i) => {
                    const row = (
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="truncate font-semibold text-foreground">{r.quizTitle}</span>
                          <span className={cn('shrink-0 font-bold text-primary', LTR)}>{r.scorePercent}%</span>
                        </div>
                        <Progress value={r.scorePercent} className="h-1.5" />
                      </div>
                    );
                    return (
                      <div key={i}>
                        {r.link ? <Link to={r.link}>{row}</Link> : row}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </Card>
        </div>
      )}

      {/* ── كورسات مقترحة ── */}
      {recommendations.length > 0 && (
        <section>
          <h3 className="mb-5 font-display text-xl font-semibold text-foreground">كورسات مقترحة لك</h3>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {recommendations.map((course) => (
              <Card key={course.courseId} className="flex w-[260px] shrink-0 flex-col gap-3 p-5">
                <div className="flex items-center justify-between gap-2">
                  <Badge>{course.category}</Badge>
                  {course.sameCategory && (
                    <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-bold text-primary">
                      من تخصّصك
                    </span>
                  )}
                </div>
                <h4 className="font-display text-base font-semibold leading-snug text-foreground">{course.title}</h4>
                <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{course.description}</p>
                <span className={cn('text-xs font-semibold text-muted-foreground', LTR)}>
                  {course.lessonsCount} درس
                </span>
                <div className="mt-auto flex gap-2 pt-1">
                  <Button size="sm" className="flex-1" onClick={() => onQuickEnroll(course.courseId)}>
                    <Plus className="size-4" /> تسجيل سريع
                  </Button>
                  <Button as={Link} to={`/catalog/${course.courseId}`} variant="outline" size="sm">
                    تفاصيل
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-9">
      <div className="h-40 animate-pulse rounded-lg bg-surface-raised" />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="h-28 animate-pulse rounded-lg bg-surface-raised" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((n) => (
          <div key={n} className="h-56 animate-pulse rounded-lg bg-surface-raised" />
        ))}
      </div>
    </div>
  );
}
