import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, Unplug } from 'lucide-react';
import api, { getCurrentUserId } from '../../services/api';
import PageShell from '@/components/ui/page-shell';
import PageHeader from '@/components/ui/page-header';
import StatCard from '@/components/ui/StatCard';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import EmptyState from '@/components/ui/empty-state';
import { normalizeEnrollment } from '../../utils/constants';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error

  useEffect(() => {
    let isMounted = true;
    api.get('/enrollments', { params: { userId: getCurrentUserId() } })
      .then((response) => {
        if (isMounted) {
          setEnrollments(response.data.map(normalizeEnrollment));
          setStatus('ready');
        }
      })
      .catch((err) => {
        console.warn('Failed to load enrollments from database.', err);
        if (isMounted) setStatus('error');
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const enrolledCourses = enrollments.map((enrollment) => ({
    ...enrollment.course,
    progress: enrollment.progress,
    lastWatchedLessonId: enrollment.lastWatchedLesson?.id || null,
  }));

  async function handleContinueLearning(courseId, lastWatchedLessonId) {
    if (lastWatchedLessonId) {
      navigate(`/study-room/${courseId}/lesson/${lastWatchedLessonId}`);
      return;
    }
    try {
      const response = await api.get('/lessons', { params: { courseId } });
      const firstLessonId = response.data?.[0]?.id;
      navigate(`/study-room/${courseId}/lesson/${firstLessonId || 1}`);
    } catch (err) {
      console.warn('Failed to load first lesson for navigation', err);
      navigate(`/study-room/${courseId}/lesson/1`);
    }
  }

  const averageProgress = enrolledCourses.length > 0
    ? Math.round(enrolledCourses.reduce((sum, c) => sum + (c.progress || 0), 0) / enrolledCourses.length)
    : 0;
  const activeCoursesCount = enrolledCourses.filter((c) => (c.progress || 0) > 0 && (c.progress || 0) < 100).length;

  const continueEnrollment = enrollments.find((e) => e.lastWatchedLesson) || enrollments[0];
  const continueCourse = continueEnrollment?.course || null;
  const continueLesson = continueEnrollment?.lastWatchedLesson || null;

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

      <div className="mb-8 flex flex-col gap-6">
        <div>
          <h2 className="font-display text-2xl font-semibold text-foreground">مرحباً بك في مساحة التعلم الخاصة بك</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            تابع تقدمك الدراسي واستكمل منهجك التعليمي للارتقاء بمهاراتك البرمجية.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <StatCard label="الكورسات المسجلة" value={`${enrolledCourses.length} منهج`} />
          <StatCard label="الكورسات الجارية" value={`${activeCoursesCount} كورس نشط`} />
          <StatCard label="متوسط الإنجاز العام" value={`${averageProgress}%`} />
        </div>
      </div>

      {continueLesson && continueCourse && (
        <Card className="mb-9 flex flex-wrap items-center justify-between gap-6 p-8">
          <div>
            <p className="mb-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-primary">
              استئناف التعلم الجاري
            </p>
            <h2 className="font-display text-xl font-semibold text-foreground">{continueLesson.title}</h2>
            <p className="mt-1 text-sm font-medium text-muted-foreground">المنهج: {continueCourse.title}</p>
          </div>
          <Button as={Link} to={`/study-room/${continueCourse.id}/lesson/${continueLesson.id}`} size="lg">
            استئناف الدرس الآن
          </Button>
        </Card>
      )}

      <h3 className="mb-5 font-display text-xl font-semibold text-foreground">
        كورساتك التعليمية المسجلة ({enrolledCourses.length})
      </h3>

      {status === 'loading' ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-56 animate-pulse rounded-lg bg-surface-raised" />
          ))}
        </div>
      ) : status === 'error' ? (
        <EmptyState
          icon={Unplug}
          title="تعذر تحميل كورساتك المسجلة"
          description="حدث خطأ أثناء الاتصال بالخادم. يرجى تحديث الصفحة أو المحاولة مرة أخرى لاحقاً."
        />
      ) : enrolledCourses.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="لم تسجل في أي كورس بعد"
          description="مساحة التعلم الخاصة بك فارغة حالياً. ابدأ رحلتك التعليمية الآن واستكشف دليل الكورسات المتاحة للتسجيل والبدء فوراً."
          action={
            <Button as={Link} to="/catalog" className="mt-1">
              تصفح دليل الكورسات
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {enrolledCourses.map((course) => (
            <Card key={course.id} className="flex flex-col justify-between gap-5 p-6">
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <Badge>{course.category}</Badge>
                  <span className="text-xs font-medium text-muted-foreground">{course.level || 'جميع المستويات'}</span>
                </div>
                <h3 className="font-display text-lg font-semibold leading-snug text-foreground">{course.title}</h3>
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{course.description}</p>
              </div>

              <div>
                <div className="mb-4 flex flex-col gap-2">
                  <div className="flex justify-between text-xs font-semibold text-foreground">
                    <span>نسبة الإنجاز</span>
                    <span className="text-primary">{course.progress || 0}%</span>
                  </div>
                  <Progress value={course.progress || 0} />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <Button size="sm" onClick={() => handleContinueLearning(course.id, course.lastWatchedLessonId)}>
                    متابعة التعلم
                  </Button>
                  <Button as={Link} to={`/catalog/${course.id}`} variant="outline" size="sm">
                    تفاصيل المنهج
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </PageShell>
  );
}
