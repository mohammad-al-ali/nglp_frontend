import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Pencil, Unplug } from 'lucide-react';
import api from '../../services/api';
import PageShell from '@/components/ui/page-shell';
import PageHeader from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import FormField from '@/components/ui/form-field';
import StepHeader from '@/components/ui/step-header';
import BackLink from '@/components/ui/back-link';
import EmptyState from '@/components/ui/empty-state';
import ImagePicker from '@/components/ui/ImagePicker';
import { categories as defaultCategories, normalizeCategory, normalizeCourse } from '../../utils/constants';

export default function ManageCourse() {
  const { courseId } = useParams();

  const [courseInfo, setCourseInfo] = useState({ title: '', description: '', categoryId: 1, imageUrl: null });
  const [categories, setCategories] = useState(defaultCategories);
  const [courseStatus, setCourseStatus] = useState('loading'); // loading | ready | error
  const [titleError, setTitleError] = useState(null);
  const [submitStatus, setSubmitStatus] = useState('idle'); // idle | saving | done | error
  const [imageStatus, setImageStatus] = useState('idle'); // idle | uploading | done | error

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
          if (combined.length > 0) setCategories(combined);
        }
      } catch (err) {
        console.warn('Backend categories unavailable. Using local category dictionary.', err);
      }
    }

    async function loadCourseDetails() {
      try {
        const response = await api.get(`/courses/${courseId}`);
        if (isMounted) {
          const normalized = normalizeCourse(response.data);
          setCourseInfo({
            title: normalized.title,
            description: normalized.description,
            categoryId: normalized.categoryId || 1,
            imageUrl: normalized.imageUrl,
          });
          setCourseStatus('ready');
        }
      } catch (err) {
        console.warn('Failed to load course details from backend.', err);
        if (isMounted) setCourseStatus('error');
      }
    }

    loadCategories();
    loadCourseDetails();

    return () => {
      isMounted = false;
    };
  }, [courseId]);

  async function handleSubmit(e) {
    if (e) e.preventDefault();
    if (!courseInfo.title.trim()) {
      setTitleError('يرجى تحديد عنوان الكورس.');
      return;
    }

    setTitleError(null);
    setSubmitStatus('saving');
    try {
      await api.put(`/courses/${courseId}`, {
        title: courseInfo.title,
        description: courseInfo.description,
        category: { id: courseInfo.categoryId },
      });
      setSubmitStatus('done');
    } catch (err) {
      console.warn('Backend rejected course update.', err);
      setSubmitStatus('error');
    }
  }

  async function handleImageChange(file) {
    if (!file) return;
    setImageStatus('uploading');
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await api.post(`/courses/${courseId}/image`, formData);
      const normalized = normalizeCourse(response.data);
      setCourseInfo((current) => ({ ...current, imageUrl: normalized.imageUrl }));
      setImageStatus('done');
    } catch (err) {
      console.warn('Failed to upload course image.', err);
      setImageStatus('error');
    }
  }

  return (
    <PageShell>
      <PageHeader eyebrow="مساحة العمل للمعلم" title="تعديل بيانات الكورس" actions={<BackLink to="/teacher">العودة لكورساتي</BackLink>} />

      {courseStatus === 'loading' ? (
        <div className="flex justify-center py-20">
          <div className="h-96 w-full max-w-xl animate-pulse rounded-lg bg-surface-raised" />
        </div>
      ) : courseStatus === 'error' ? (
        <EmptyState icon={Unplug} title="تعذر تحميل بيانات الكورس" description="حدث خطأ أثناء الاتصال بالخادم. يرجى تحديث الصفحة أو المحاولة مرة أخرى." />
      ) : (
        <div className="flex justify-center">
          <Card className="w-full max-w-xl p-9">
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <StepHeader icon={Pencil} title="تحديث مواصفات المنهج الدراسي" />

              <p className="text-sm leading-relaxed text-muted-foreground">
                قم بتحديث تفاصيل الكورس ومحتواه التعريفي. هذه التعديلات ستظهر مباشرة للطلاب في دليل الكورسات.
              </p>

              <FormField label="عنوان الكورس" error={titleError} htmlFor="edit-course-title">
                <Input
                  id="edit-course-title"
                  value={courseInfo.title}
                  onChange={(e) => setCourseInfo({ ...courseInfo, title: e.target.value })}
                  placeholder="مثال: احترف بناء واجهات المستخدم وتجربة المستخدم"
                  aria-invalid={Boolean(titleError)}
                />
              </FormField>

              <FormField label="وصف الكورس والمنهج التفصيلي" htmlFor="edit-course-description">
                <Textarea
                  id="edit-course-description"
                  value={courseInfo.description}
                  onChange={(e) => setCourseInfo({ ...courseInfo, description: e.target.value })}
                  placeholder="اكتب وصفاً مفصلاً يوضح الأهداف التعليمية للكورس، المهارات المكتسبة، والمشاريع البرمجية التي سيتم تطبيقها."
                  rows={6}
                />
              </FormField>

              <FormField label="تصنيف المادة التعليمية" htmlFor="edit-course-category">
                <Select
                  id="edit-course-category"
                  value={courseInfo.categoryId}
                  onChange={(e) => setCourseInfo({ ...courseInfo, categoryId: Number(e.target.value) })}
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </Select>
              </FormField>

              <div className="flex flex-col gap-2">
                <ImagePicker
                  label="صورة غلاف الكورس"
                  hint={imageStatus === 'uploading' ? 'جاري رفع الصورة...' : 'تظهر كصورة غلاف للكورس في دليل الكورسات وبطاقاته.'}
                  existingUrl={courseInfo.imageUrl}
                  onChange={handleImageChange}
                />
                {imageStatus === 'error' && <p className="text-xs text-error">تعذّر رفع الصورة، تحقق من اتصال الخادم وحاول مرة أخرى.</p>}
              </div>

              <div className="flex flex-col items-center gap-3 border-t border-border pt-6">
                <Button type="submit" disabled={submitStatus === 'saving'} className="w-full">
                  {submitStatus === 'saving' ? 'جاري حفظ التغييرات...' : 'حفظ التغييرات'}
                </Button>

                {submitStatus === 'done' && (
                  <Alert variant="success" className="w-full">
                    <AlertDescription>تم حفظ تفاصيل المنهج الدراسي بنجاح.</AlertDescription>
                  </Alert>
                )}
                {submitStatus === 'error' && (
                  <Alert variant="destructive" className="w-full">
                    <AlertDescription>تعذّر حفظ التغييرات. تحقق من الاتصال بالخادم وحاول مرة أخرى.</AlertDescription>
                  </Alert>
                )}
              </div>
            </form>
          </Card>
        </div>
      )}
    </PageShell>
  );
}
