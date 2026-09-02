import { useState, useEffect } from 'react';
import { Video } from 'lucide-react';
import api, { getCurrentUserId } from '../../services/api';
import PageShell from '@/components/ui/page-shell';
import PageHeader from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import FormField from '@/components/ui/form-field';
import StepHeader from '@/components/ui/step-header';
import FileDropzone from '@/components/ui/file-dropzone';
import UploadQueueItem from '@/components/ui/upload-queue-item';
import ImagePicker from '@/components/ui/ImagePicker';
import { useUploadQueue } from '../../hooks/useUploadQueue';
import { categories as defaultCategories, normalizeCategory, normalizeCourse } from '../../utils/constants';
import { notify } from '@/lib/toast';
import { SUCCESS } from '@/lib/messages';

export default function CourseBuilder() {
  const [categories, setCategories] = useState(defaultCategories);
  const [courseInfo, setCourseInfo] = useState({ title: '', description: '', categoryId: 4 });
  const [courseImageFile, setCourseImageFile] = useState(null);
  const [titleError, setTitleError] = useState(null);
  const [submitStatus, setSubmitStatus] = useState('idle'); // idle | saving | done | error
  const [savedCourse, setSavedCourse] = useState(null);

  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonDescription, setLessonDescription] = useState('');
  const { queue, queueLesson, setItemImage, uploadAll } = useUploadQueue();

  useEffect(() => {
    let isMounted = true;
    async function loadCategories() {
      try {
        const rootResponse = await api.get('/categories/root');
        const rootCategories = rootResponse.data.map((category) => normalizeCategory(category));

        const childResponses = await Promise.all(
          rootCategories.map((category) => api.get(`/categories/${category.id}/sub`).catch(() => ({ data: [] })))
        );
        const childCategories = childResponses.flatMap((response, index) =>
          response.data.map((category) => normalizeCategory(category, rootCategories[index].id))
        );

        if (isMounted) {
          const combined = [...rootCategories, ...childCategories];
          if (combined.length > 0) {
            setCategories(combined);
            setCourseInfo((current) => ({ ...current, categoryId: combined[0].id }));
          }
        }
      } catch (err) {
        console.warn('Backend categories unavailable. Using local category dictionary.', err);
      }
    }
    loadCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  function handleFiles(fileList) {
    const all = Array.from(fileList);
    const accepted = all.filter((file) => file.type === 'video/mp4' || file.name.toLowerCase().endsWith('.mp4'));
    accepted.forEach((file) => {
      queueLesson({
        file,
        title: lessonTitle.trim() || file.name.replace(/\.mp4$/i, ''),
        description: lessonDescription.trim(),
      });
    });
    if (accepted.length < all.length) {
      notify.warning('تم تجاهل بعض الملفات — يُقبل فيديو بصيغة MP4 فقط.');
    }
    setLessonTitle('');
    setLessonDescription('');
  }

  async function handleFinalSubmit() {
    const title = courseInfo.title.trim();
    if (title.length < 3) {
      setTitleError('عنوان الكورس مطلوب (3 أحرف على الأقل).');
      notify.error('يرجى تصحيح الحقول المميّزة ثم إعادة المحاولة.');
      return;
    }
    setTitleError(null);
    setSubmitStatus('saving');

    let currentCourseId;
    try {
      const response = await api.post('/courses', {
        title: courseInfo.title,
        description: courseInfo.description,
        category: { id: courseInfo.categoryId },
        teacher: { id: getCurrentUserId() },
      });
      currentCourseId = response.data?.id;
      let savedCourseData = response.data;

      if (courseImageFile && currentCourseId) {
        const courseImageForm = new FormData();
        courseImageForm.append('image', courseImageFile);
        try {
          const imageResponse = await api.post(`/courses/${currentCourseId}/image`, courseImageForm);
          savedCourseData = imageResponse.data;
        } catch (imageErr) {
          console.warn('Failed to upload course cover image.', imageErr);
        }
      }
      setSavedCourse(normalizeCourse(savedCourseData));
    } catch (err) {
      setSubmitStatus('error');
      notify.error(err.friendlyMessage);
      return;
    }

    try {
      const uploaded = await uploadAll(currentCourseId);
      setSubmitStatus('done');
      notify.success(SUCCESS.COURSE_CREATED);
      if (uploaded && uploaded.length > 0) {
        notify.success(SUCCESS.LESSONS_UPLOADED(uploaded.length));
      }
    } catch (err) {
      setSubmitStatus('error');
      notify.error(err.friendlyMessage || 'تم إنشاء الكورس لكن تعذّر رفع بعض الدروس.');
    }
  }

  return (
    <PageShell>
      <PageHeader eyebrow="بوابة المعلم" title="استوديو بناء الكورسات والدروس" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="flex flex-col gap-5 p-8">
          <StepHeader step="1" title="مواصفات الكورس التعليمي" />
          <p className="text-sm leading-relaxed text-muted-foreground">
            قم بتهيئة البيانات الوصفية للمنهج الدراسي. سيتم حفظ الكورس ورفع جميع الدروس المرفقة في عملية واحدة عند النقر على الزر بالأسفل.
          </p>

          <FormField label="عنوان الكورس" error={titleError} htmlFor="course-title">
            <Input
              id="course-title"
              value={courseInfo.title}
              onChange={(e) => setCourseInfo({ ...courseInfo, title: e.target.value })}
              placeholder="مثال: احترف بناء تطبيقات الويب باستخدام React"
              aria-invalid={Boolean(titleError)}
            />
          </FormField>

          <FormField label="وصف المنهج وخلاصة الكورس" htmlFor="course-description">
            <Textarea
              id="course-description"
              value={courseInfo.description}
              onChange={(e) => setCourseInfo({ ...courseInfo, description: e.target.value })}
              placeholder="اكتب وصفاً تفصيلياً يوضح المواضيع التي سيتم شرحها، والمهارات التي سيكتسبها الطلاب بعد دراسة المنهج."
              rows={5}
            />
          </FormField>

          <FormField label="تصنيف المادة التعليمية" htmlFor="course-category">
            <Select
              id="course-category"
              value={courseInfo.categoryId}
              onChange={(e) => setCourseInfo({ ...courseInfo, categoryId: Number(e.target.value) })}
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </FormField>

          <ImagePicker
            label="صورة غلاف الكورس (اختياري)"
            hint="تظهر في بطاقة الكورس بصفحة الفهرس والكتالوج."
            onChange={setCourseImageFile}
          />
        </Card>

        <Card className="flex flex-col gap-5 p-8">
          <StepHeader step="2" title="استوديو إضافة الدروس" />
          <p className="text-sm leading-relaxed text-muted-foreground">
            صمّم هيكل دروسك التعليمية. أدخل عنواناً للدرس، ثم اسحب وأفلت ملف فيديو mp4 لإضافته لقائمة الرفع.
          </p>

          <FormField label="عنوان الدرس (اختياري)" htmlFor="lesson-title">
            <Input
              id="lesson-title"
              value={lessonTitle}
              onChange={(e) => setLessonTitle(e.target.value)}
              placeholder="مثال: 01 - مقدمة عامة في هندسة البرمجيات"
            />
          </FormField>

          <FormField label="وصف الدرس (اختياري)" htmlFor="lesson-description">
            <Textarea
              id="lesson-description"
              value={lessonDescription}
              onChange={(e) => setLessonDescription(e.target.value)}
              placeholder="اكتب وصفاً موجزاً لمحتوى هذا الدرس والمهارات المستهدفة..."
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
              <h3 className="text-sm font-semibold text-foreground">قائمة الدروس المجهزة للرفع ({queue.length})</h3>
              {queue.map((item) => (
                <UploadQueueItem key={item.id} item={item} onImageChange={setItemImage} />
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="mt-6 flex flex-col items-center gap-3 p-6">
        <Button onClick={handleFinalSubmit} disabled={submitStatus === 'saving'} className="w-full max-w-md" size="lg">
          {submitStatus === 'saving' ? 'جاري حفظ مواصفات الكورس ورفع الدروس...' : 'حفظ الكورس ونشر المحتوى بالكامل'}
        </Button>

        {submitStatus === 'done' && savedCourse && (
          <p className="text-sm font-medium text-success">
            تم نشر المنهج الدراسي «{savedCourse.title}» وحفظ الدروس بنجاح.
          </p>
        )}
      </Card>
    </PageShell>
  );
}
