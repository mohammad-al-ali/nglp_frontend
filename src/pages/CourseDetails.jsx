import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FolderOpen, BookOpen, FileText, Lock, Users, Clock, GraduationCap, BarChart3 } from 'lucide-react';
import api, { getCurrentUserId } from '../services/api';
import PageShell from '@/components/ui/page-shell';
import PageHeader from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import EmptyState from '@/components/ui/empty-state';
import BackLink from '@/components/ui/back-link';
import { cn } from '@/lib/utils';
import { normalizeCourse, normalizeLesson } from '../utils/constants';
import { notify } from '@/lib/toast';
import { SUCCESS } from '@/lib/messages';

function translateLevel(lvl) {
  if (!lvl) return 'جميع المستويات';
  const l = lvl.toLowerCase();
  if (l.includes('begin') || l.includes('مبتدئ')) return 'مبتدئ';
  if (l.includes('inter') || l.includes('متوسط')) return 'متوسط';
  if (l.includes('adv') || l.includes('متقدم')) return 'متقدم';
  return lvl;
}

function InfoRow({ icon: Icon, label, value, valueClassName }) {
  return (
    <div className="flex items-center justify-between border-b border-dashed border-border py-3 last:border-b-0">
      <span className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
        <Icon className="size-4" />
        {label}
      </span>
      <span className={cn('text-sm font-bold text-foreground', valueClassName)}>{value}</span>
    </div>
  );
}

export default function CourseDetails() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [enrollStatus, setEnrollStatus] = useState('idle'); // idle | saving | enrolled | error
  const [pageStatus, setPageStatus] = useState('loading'); // loading | ready | error
  const [pageError, setPageError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadCourseDetails() {
      try {
        setPageStatus('loading');

        const [courseResponse, lessonsResponse] = await Promise.all([
          api.get(`/courses/${courseId}`),
          api.get('/lessons', { params: { courseId } }),
        ]);

        let userEnrolled = false;
        try {
          const userId = getCurrentUserId();
          if (userId) {
            const enrollResponse = await api.get('/enrollments', { params: { userId } });
            userEnrolled = enrollResponse.data.some((enroll) => {
              const enrolledCourseId = enroll.courseId ?? enroll.course?.id;
              return Number(enrolledCourseId) === Number(courseId);
            });
          }
        } catch (e) {
          console.warn('Failed to verify user enrollment status', e);
        }

        if (isMounted) {
          setCourse(normalizeCourse(courseResponse.data));
          setLessons(lessonsResponse.data.map((lesson) => normalizeLesson(lesson)));
          if (userEnrolled) setEnrollStatus('enrolled');
          setPageStatus('ready');
        }
      } catch (err) {
        console.error('Failed to load course details from database.', err);
        if (isMounted) {
          setPageError('تعذر تحميل تفاصيل الكورس من قاعدة البيانات. يرجى التحقق من اتصال الخادم.');
          setPageStatus('error');
        }
      }
    }

    loadCourseDetails();
    return () => {
      isMounted = false;
    };
  }, [courseId]);

  const startLesson = lessons[0];

  async function enrollInCourse() {
    if (enrollStatus === 'enrolled') {
      navigate(startLesson ? `/study-room/${course.id}/lesson/${startLesson.id}` : '/dashboard');
      return;
    }

    setEnrollStatus('saving');
    try {
      await api.post('/enrollments', null, {
        params: { userId: Number(getCurrentUserId()), courseId: Number(courseId) },
      });
      setEnrollStatus('enrolled');
      notify.success(SUCCESS.ENROLLED);
      setTimeout(() => navigate('/dashboard'), 1200);
    } catch (err) {
      setEnrollStatus('error');
      notify.error(err.friendlyMessage);
    }
  }

  if (pageStatus === 'loading') {
    return (
      <PageShell>
        <div className="grid grid-cols-1 gap-7 lg:grid-cols-[1.8fr_1fr]">
          <div className="h-96 animate-pulse rounded-lg bg-surface-raised" />
          <div className="h-96 animate-pulse rounded-lg bg-surface-raised" />
        </div>
      </PageShell>
    );
  }

  if (pageStatus === 'error' || !course) {
    return (
      <PageShell>
        <EmptyState
          icon={FolderOpen}
          title="تفاصيل الكورس غير متوفرة"
          description={pageError || 'عذراً، لم يتم العثور على هذا الكورس التعليمي في قاعدة البيانات.'}
          action={
            <Button as={Link} to="/catalog" className="mt-1">
              العودة لدليل الكورسات
            </Button>
          }
        />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow={course.category || 'تصنيف تعليمي'}
        title={course.title}
        actions={<Badge>مسار استكشاف المعرفة</Badge>}
      />

      <div className="grid grid-cols-1 gap-7 lg:grid-cols-[1.8fr_1fr] lg:items-start">
        {/* Main column: description + curriculum */}
        <div className="flex flex-col gap-6">
          <Card className="flex flex-col gap-4 p-7">
            <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-foreground">
              <FileText className="size-5 text-muted-foreground" />
              وصف الكورس التدريبي
            </h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">
              {course.description || 'لم يتم إضافة وصف تفصيلي لهذا الكورس بعد.'}
            </p>
            {enrollStatus === 'enrolled' && (
              <div className="mt-1 border-t border-border pt-4">
                <div className="mb-2 flex justify-between text-xs font-semibold text-muted-foreground">
                  <span>نسبة تقدمك في الدراسة</span>
                  <span>{course.progress || 0}%</span>
                </div>
                <Progress value={course.progress || 0} />
              </div>
            )}
          </Card>

          <Card className="p-7">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-foreground">
                <BookOpen className="size-5 text-muted-foreground" />
                منهج الدراسة والدروس
              </h2>
              <Badge>{lessons.length} دروس منشورة</Badge>
            </div>

            {lessons.length === 0 ? (
              <EmptyState icon={BookOpen} title="لا توجد دروس منشورة لهذا الكورس التعليمي بعد" description="سيقوم المعلم بإضافة محتوى الدروس قريباً." />
            ) : (
              <div className="flex flex-col gap-3">
                {lessons.map((lesson, index) => {
                  const lessonPath = `/study-room/${course.id}/lesson/${lesson.id}`;
                  const isLinkable = enrollStatus === 'enrolled';

                  const content = (
                    <div className="flex w-full items-center justify-between">
                      <div className="flex items-center gap-3.5">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary-soft text-xs font-bold text-primary">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <div className="flex flex-col gap-0.5">
                          <strong className="text-sm text-foreground">{lesson.title}</strong>
                          {lesson.description && (
                            <span className="line-clamp-1 text-xs font-medium text-muted-foreground">{lesson.description}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2.5">
                        <span className="text-xs font-bold text-muted-foreground">{lesson.duration || '00:00'}</span>
                        {!isLinkable && <Lock className="size-3.5 text-muted-foreground" title="يتطلب التسجيل في الكورس" />}
                      </div>
                    </div>
                  );

                  if (isLinkable) {
                    return (
                      <Link
                        key={lesson.id}
                        to={lessonPath}
                        className="flex items-center rounded-md border border-border bg-surface px-4.5 py-3.5 transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:border-primary-border hover:bg-primary-soft"
                      >
                        {content}
                      </Link>
                    );
                  }

                  return (
                    <div key={lesson.id} className="flex items-center rounded-md border border-border bg-surface-raised px-4.5 py-3.5 opacity-85">
                      {content}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Side column: enrollment card */}
        <div className="lg:sticky lg:top-6">
          <Card className="flex flex-col gap-5 p-6">
            <div className="flex justify-center">
              <Badge variant="success">وصول فوري للمحتوى</Badge>
            </div>

            <div className="border-b border-border pb-4 text-center">
              <div className="mb-1 text-xs font-semibold text-muted-foreground">بوابة التسجيل الإلكتروني</div>
              <div className="font-display text-2xl font-bold text-primary">مجاني بالكامل</div>
            </div>

            <div className="flex flex-col">
              <InfoRow icon={BarChart3} label="المستوى الموصى به:" value={translateLevel(course.level)} />
              <InfoRow
                icon={Clock}
                label="المدة التقديرية:"
                value={course.durationSeconds ? `${Math.round(course.durationSeconds / 3600)} ساعة` : 'دراسة ذاتية'}
              />
              <InfoRow icon={Users} label="الطلاب المستفيدون:" value={`${course.students?.toLocaleString('en-US') ?? 0} طالب`} />
              <InfoRow icon={FolderOpen} label="إجمالي الدروس:" value={`${lessons.length} درس`} />
              <InfoRow icon={GraduationCap} label="شهادة إتمام:" value="متوفرة" valueClassName="text-success" />
            </div>

            {enrollStatus === 'error' && (
              <Alert variant="destructive">
                <AlertDescription>عذراً، فشلت عملية التسجيل في الكورس. يرجى التحقق من اتصال الخادم والمحاولة مرة أخرى.</AlertDescription>
              </Alert>
            )}

            <div>
              <Button
                onClick={enrollInCourse}
                disabled={enrollStatus === 'saving'}
                className={cn('w-full', enrollStatus === 'enrolled' && 'bg-success hover:bg-success/90')}
                size="lg"
              >
                {enrollStatus === 'enrolled'
                  ? 'ابدأ التعلم الآن (مسجل بالفعل)'
                  : enrollStatus === 'saving'
                    ? 'جاري تسجيلك في الكورس...'
                    : 'سجل الآن في الكورس'}
              </Button>

              {enrollStatus !== 'enrolled' && (
                <p className="mt-2.5 text-center text-xs text-muted-foreground">
                  عند الضغط على "سجل الآن" سيتم إضافتك فوراً وتوجيهك إلى مساحة التعلم.
                </p>
              )}
            </div>

            <BackLink to="/catalog" className="w-full justify-center">
              العودة لدليل الكورسات
            </BackLink>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
