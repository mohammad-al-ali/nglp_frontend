import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Video, Zap, BookOpen, Inbox, GraduationCap, FolderOpen, Unplug, ImagePlus } from 'lucide-react';
import api, { getCurrentUserId } from '../../services/api';
import PageShell from '@/components/ui/page-shell';
import PageHeader from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import FormField from '@/components/ui/form-field';
import StepHeader from '@/components/ui/step-header';
import BackLink from '@/components/ui/back-link';
import FileDropzone from '@/components/ui/file-dropzone';
import UploadQueueItem from '@/components/ui/upload-queue-item';
import EmptyState from '@/components/ui/empty-state';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import { useUploadQueue } from '../../hooks/useUploadQueue';
import { normalizeCourse, normalizeLesson } from '../../utils/constants';

export default function ManageLessons() {
  const { courseId } = useParams();

  const [courseDetails, setCourseDetails] = useState(null);
  const [courseStatus, setCourseStatus] = useState('loading'); // loading | ready | error
  const [lessons, setLessons] = useState([]);
  const [lessonsStatus, setLessonsStatus] = useState('loading'); // loading | ready | error

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  const [imageTargetLessonId, setImageTargetLessonId] = useState(null);
  const [imageUploadStatus, setImageUploadStatus] = useState({}); // { [lessonId]: 'uploading' | 'error' }
  const lessonImageInputRef = useRef(null);

  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonDescription, setLessonDescription] = useState('');
  const { queue, queueLesson, setItemImage, uploadAll } = useUploadQueue();
  const [submitStatus, setSubmitStatus] = useState('idle'); // idle | uploading | done | error
  const [submitError, setSubmitError] = useState(null);

  const [teacherCourses, setTeacherCourses] = useState([]);
  const [pickerStatus, setPickerStatus] = useState('loading'); // loading | ready | error

  useEffect(() => {
    if (courseId) return;
    let isMounted = true;
    api.get('/courses', { params: { teacherId: getCurrentUserId() } })
      .then((response) => {
        if (isMounted) {
          setTeacherCourses(response.data.map(normalizeCourse));
          setPickerStatus('ready');
        }
      })
      .catch((err) => {
        console.warn('Failed to load courses for picker.', err);
        if (isMounted) setPickerStatus('error');
      });
    return () => {
      isMounted = false;
    };
  }, [courseId]);

  useEffect(() => {
    if (!courseId) return;
    let isMounted = true;

    // Deferred to a microtask so switching courseId doesn't set state
    // synchronously within the effect body (cascading-render lint rule).
    Promise.resolve().then(() => {
      if (isMounted) {
        setCourseStatus('loading');
        setLessonsStatus('loading');
      }
    });

    api.get(`/courses/${courseId}`)
      .then((response) => {
        if (isMounted) {
          setCourseDetails(normalizeCourse(response.data));
          setCourseStatus('ready');
        }
      })
      .catch((err) => {
        console.warn('Failed to load course details.', err);
        if (isMounted) setCourseStatus('error');
      });

    api.get('/lessons', { params: { courseId } })
      .then((response) => {
        if (isMounted) {
          setLessons(response.data.map(normalizeLesson));
          setLessonsStatus('ready');
        }
      })
      .catch((err) => {
        console.warn('Failed to load lessons.', err);
        if (isMounted) setLessonsStatus('error');
      });

    return () => {
      isMounted = false;
    };
  }, [courseId]);

  async function handleConfirmDelete() {
    try {
      await api.delete(`/lessons/${deleteTarget.id}`);
      setLessons((current) => current.filter((l) => l.id !== deleteTarget.id));
      setDeleteError(null);
    } catch (err) {
      console.warn('Failed to delete lesson.', err);
      setDeleteError(`تعذّر حذف الدرس "${deleteTarget.title}". يرجى المحاولة مرة أخرى.`);
    }
  }

  function triggerLessonImageUpload(lessonId) {
    setImageTargetLessonId(lessonId);
    lessonImageInputRef.current?.click();
  }

  async function handleLessonImageChange(event) {
    const file = event.target.files?.[0];
    const lessonId = imageTargetLessonId;
    event.target.value = '';
    if (!file || !lessonId) return;

    setImageUploadStatus((current) => ({ ...current, [lessonId]: 'uploading' }));
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await api.post(`/lessons/${lessonId}/image`, formData);
      const normalized = normalizeLesson(response.data);
      setLessons((current) => current.map((l) => (l.id === lessonId ? { ...l, imageUrl: normalized.imageUrl } : l)));
      setImageUploadStatus((current) => {
        const next = { ...current };
        delete next[lessonId];
        return next;
      });
    } catch (err) {
      console.warn('Failed to upload lesson image.', err);
      setImageUploadStatus((current) => ({ ...current, [lessonId]: 'error' }));
    }
  }

  function handleFiles(fileList) {
    Array.from(fileList)
      .filter((file) => file.type === 'video/mp4' || file.name.endsWith('.mp4'))
      .forEach((file) => {
        queueLesson({
          file,
          title: lessonTitle.trim() || file.name.replace(/\.mp4$/i, ''),
          description: lessonDescription.trim(),
        });
      });
    setLessonTitle('');
    setLessonDescription('');
  }

  async function handleFinalSubmit() {
    const pendingCount = queue.filter((item) => item.status === 'pending').length;
    if (pendingCount === 0) {
      setSubmitStatus('error');
      setSubmitError('لا توجد دروس جديدة في قائمة الانتظار لرفعها.');
      return;
    }

    setSubmitStatus('uploading');
    setSubmitError(null);
    try {
      const uploaded = await uploadAll(courseId);
      setLessons((current) => [...current, ...uploaded.map(normalizeLesson)]);
      setSubmitStatus('done');
    } catch (err) {
      console.error('Some lessons failed to upload.', err);
      setSubmitStatus('error');
      setSubmitError('حدث خطأ أثناء رفع بعض الدروس. تحقق من الاتصال بالخادم وحاول مرة أخرى.');
    }
  }

  // --- Fallback View: Select a Course ---
  if (!courseId) {
    return (
      <PageShell>
        <PageHeader eyebrow="مساحة العمل للمعلم" title="اختر الكورس لإدارة دروسه" />

        {pickerStatus === 'loading' ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-56 animate-pulse rounded-lg bg-surface-raised" />
            ))}
          </div>
        ) : pickerStatus === 'error' ? (
          <EmptyState icon={Unplug} title="تعذر تحميل كورساتك" description="حدث خطأ أثناء الاتصال بالخادم. يرجى تحديث الصفحة أو المحاولة مرة أخرى." />
        ) : teacherCourses.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title="لا توجد كورسات متاحة"
            description="يرجى إنشاء كورس تعليمي أولاً لتتمكن من إضافة وإدارة دروسه."
            action={
              <Button as={Link} to="/teacher/course-builder" className="mt-1">
                إنشاء كورس جديد
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {teacherCourses.map((course) => (
              <Card key={course.id} className="flex flex-col gap-3.5 p-6">
                <div className="flex items-center justify-between">
                  <span className="rounded bg-primary-soft px-2.5 py-1 text-xs font-bold text-primary">{course.category}</span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <FolderOpen className="size-3.5" />
                    {course.lessonsCount} درس
                  </span>
                </div>
                <h4 className="flex-1 font-display text-base font-semibold text-foreground">{course.title}</h4>
                <Button as={Link} to={`/teacher/manage-lessons/${course.id}`}>
                  إدارة دروس الكورس
                </Button>
              </Card>
            ))}
          </div>
        )}
      </PageShell>
    );
  }

  // --- Main View: Dual-Pane Lessons Studio ---
  return (
    <PageShell>
      <PageHeader
        eyebrow="مساحة العمل للمعلم"
        title={courseDetails ? `إدارة دروس: ${courseDetails.title}` : 'استوديو إدارة الدروس'}
        actions={<BackLink to="/teacher">العودة لكورساتي</BackLink>}
      />

      {courseStatus === 'loading' ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="h-96 animate-pulse rounded-lg bg-surface-raised" />
          <div className="h-96 animate-pulse rounded-lg bg-surface-raised" />
        </div>
      ) : courseStatus === 'error' ? (
        <EmptyState icon={Unplug} title="تعذر تحميل بيانات الكورس" description="حدث خطأ أثناء الاتصال بالخادم. يرجى تحديث الصفحة أو المحاولة مرة أخرى." />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Left Pane: Add New Lesson */}
            <Card className="flex flex-col gap-5 p-8">
              <StepHeader icon={Zap} title="إضافة درس فيديو جديد" />
              <p className="text-sm leading-relaxed text-muted-foreground">
                أدخل عنوان الدرس ووصفه، ثم اسحب وأفلت ملف الفيديو بتنسيق mp4 لإدراجه في قائمة الرفع بالأسفل.
              </p>

              <FormField label="عنوان الدرس الجديد (اختياري)" htmlFor="new-lesson-title">
                <Input
                  id="new-lesson-title"
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                  placeholder="مثال: 05 - مقدمة في معالجة طلبات الرفع"
                />
              </FormField>

              <FormField label="وصف الدرس الجديد (اختياري)" htmlFor="new-lesson-description">
                <Textarea
                  id="new-lesson-description"
                  value={lessonDescription}
                  onChange={(e) => setLessonDescription(e.target.value)}
                  placeholder="اكتب وصفاً موجزاً لمحتوى هذا الدرس الجديد والمهارات المستهدفة..."
                  rows={3}
                />
              </FormField>

              <FileDropzone
                accept="video/mp4"
                multiple
                onFiles={handleFiles}
                icon={Video}
                title="اسحب وأفلت فيديو الدرس هنا"
                hint="صيغة MP4 فقط • يدعم إدراج ملفات متعددة في قائمة الانتظار"
              />

              {queue.length > 0 && (
                <div className="flex flex-col gap-3">
                  <h3 className="text-sm font-semibold text-foreground">قائمة الدروس الجديدة الجاهزة للرفع ({queue.length})</h3>
                  {queue.map((item) => (
                    <UploadQueueItem key={item.id} item={item} onImageChange={setItemImage} />
                  ))}
                </div>
              )}

              <Button onClick={handleFinalSubmit} disabled={submitStatus === 'uploading'}>
                {submitStatus === 'uploading' ? 'جاري رفع الدروس الجديدة...' : 'رفع ونشر جميع الدروس الجديدة'}
              </Button>

              {submitStatus === 'done' && (
                <Alert variant="success">
                  <AlertDescription>تم نشر الدروس الجديدة المرفقة بنجاح على قاعدة البيانات.</AlertDescription>
                </Alert>
              )}
              {submitStatus === 'error' && (
                <Alert variant="destructive">
                  <AlertDescription>{submitError}</AlertDescription>
                </Alert>
              )}
            </Card>

            {/* Right Pane: Existing Lessons */}
            <Card className="flex min-h-[400px] flex-col gap-5 p-8">
              <StepHeader icon={BookOpen} title={`هيكل المنهج والدروس الحالية (${lessons.length})`} />
              <p className="text-sm leading-relaxed text-muted-foreground">
                قائمة بالدروس التعليمية المدرجة حالياً ضمن هذا المنهج. يمكنك حذف أي درس أو إدارة اختباراته.
              </p>

              {deleteError && (
                <Alert variant="destructive">
                  <AlertDescription>{deleteError}</AlertDescription>
                </Alert>
              )}

              {lessonsStatus === 'loading' ? (
                <div className="flex flex-col gap-3">
                  {[1, 2, 3].map((x) => (
                    <div key={x} className="h-[70px] animate-pulse rounded-md bg-surface-raised" />
                  ))}
                </div>
              ) : lessonsStatus === 'error' ? (
                <EmptyState icon={Unplug} title="تعذر تحميل الدروس" description="حدث خطأ أثناء الاتصال بالخادم." />
              ) : lessons.length === 0 ? (
                <EmptyState icon={Inbox} title="لا توجد دروس مضافة حالياً" description="استخدم لوحة الاستوديو على اليسار لإضافة ورفع دروس جديدة." />
              ) : (
                <div className="flex flex-col gap-3">
                  {lessons.map((lesson, idx) => (
                    <div
                      key={lesson.id}
                      className="flex flex-col gap-2 rounded-md border border-border p-4 transition-colors duration-200 ease-in-out hover:border-primary-border"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-3">
                          {lesson.imageUrl ? (
                            <img src={lesson.imageUrl} alt="" className="size-10 shrink-0 rounded-md object-cover" />
                          ) : (
                            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-raised text-sm font-bold text-muted-foreground">
                              {idx + 1}
                            </span>
                          )}
                          <div className="min-w-0">
                            <strong className="block truncate text-sm font-semibold text-foreground">{lesson.title}</strong>
                            <span className="text-xs text-muted-foreground">مدة العرض: {lesson.duration}</span>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={imageUploadStatus[lesson.id] === 'uploading'}
                            title={imageUploadStatus[lesson.id] === 'error' ? 'تعذّر رفع الصورة، حاول مرة أخرى' : 'تغيير صورة الدرس'}
                            className={imageUploadStatus[lesson.id] === 'error' ? 'border-error-border text-error hover:bg-error-soft' : undefined}
                            onClick={() => triggerLessonImageUpload(lesson.id)}
                          >
                            <ImagePlus className="size-3.5" />
                            {imageUploadStatus[lesson.id] === 'uploading' ? 'جاري الرفع...' : 'الصورة'}
                          </Button>
                          <Button as={Link} to={`/teacher/quiz-manager/${courseId}/${lesson.id}`} variant="outline" size="sm">
                            الاختبارات
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-error-border text-error hover:bg-error-soft"
                            onClick={() => setDeleteTarget({ id: lesson.id, title: lesson.title })}
                          >
                            حذف
                          </Button>
                        </div>
                      </div>

                      {imageUploadStatus[lesson.id] === 'error' && (
                        <p className="text-xs text-error">تعذّر رفع صورة هذا الدرس، تحقق من اتصال الخادم وحاول مرة أخرى.</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <input ref={lessonImageInputRef} type="file" accept="image/*" onChange={handleLessonImageChange} className="hidden" />
        </>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="حذف الدرس"
        description={deleteTarget ? `هل أنت متأكد من رغبتك في حذف الدرس "${deleteTarget.title}" نهائياً؟` : ''}
        confirmLabel="حذف"
        destructive
        onConfirm={handleConfirmDelete}
      />
    </PageShell>
  );
}
