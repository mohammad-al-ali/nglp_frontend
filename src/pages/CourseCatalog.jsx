import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Unplug, FolderOpen } from 'lucide-react';
import api from '../services/api';
import PageShell from '@/components/ui/page-shell';
import PageHeader from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import EmptyState from '@/components/ui/empty-state';
import CourseCard from '@/components/CourseCard';
import { categoryMatches, normalizeCategory, normalizeCourse } from '../utils/constants';

export default function CourseCatalog() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [catalogState, setCatalogState] = useState({
    categories: [],
    courses: [],
    loading: true,
    error: null,
  });

  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');

  useEffect(() => {
    let isMounted = true;
    async function loadCatalog() {
      try {
        const rootResponse = await api.get('/categories/root');
        const rootCategories = rootResponse.data.map((category) => normalizeCategory(category));

        const childResponses = await Promise.all(
          rootCategories.map((category) => api.get(`/categories/${category.id}/sub`).catch(() => ({ data: [] })))
        );
        const childCategories = childResponses.flatMap((response, index) =>
          response.data.map((category) => normalizeCategory(category, rootCategories[index].id))
        );

        const courseResponse = await api.get('/courses');
        const liveCategories = [...rootCategories, ...childCategories];
        const liveCourses = courseResponse.data.map(normalizeCourse);

        if (isMounted) {
          setCatalogState({ categories: liveCategories, courses: liveCourses, loading: false, error: null });
        }
      } catch (err) {
        console.error('Failed to load database catalog from backend.', err);
        if (isMounted) {
          setCatalogState({
            categories: [],
            courses: [],
            loading: false,
            error: 'تعذر تحميل الكورسات والتصنيفات من قاعدة البيانات. يرجى التحقق من اتصال الخادم.',
          });
        }
      }
    }
    loadCatalog();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredCourses = catalogState.courses.filter((course) =>
    categoryMatches(course, selectedCategory, catalogState.categories)
  );

  return (
    <PageShell>
      <PageHeader
        eyebrow="دليل الكورسات التعليمية"
        title="استكشف الكورسات والمسارات"
        actions={catalogState.error ? <Badge variant="destructive">خطأ في الاتصال بالخادم</Badge> : null}
      />

      <div className="mb-6 flex items-center gap-2 overflow-x-auto rounded-md border border-border bg-surface p-3">
        <span className="shrink-0 font-mono text-xs font-semibold text-muted-foreground">التصنيف:</span>

        <button
          onClick={() => {
            setSelectedCategory('all');
            setSearchParams({});
          }}
          className={cn(
            'inline-flex h-8 shrink-0 items-center whitespace-nowrap rounded-md border px-3 text-xs font-semibold transition-all duration-200 ease-in-out',
            selectedCategory === 'all'
              ? 'border-primary-border bg-primary-soft text-primary'
              : 'border-border bg-surface text-foreground hover:bg-surface-raised'
          )}
        >
          جميع الكورسات
        </button>

        {catalogState.categories.map((category) => {
          const isSelected = selectedCategory === String(category.id);
          return (
            <button
              key={category.id}
              onClick={() => {
                setSelectedCategory(String(category.id));
                setSearchParams({ category: category.id });
              }}
              className={cn(
                'inline-flex h-8 shrink-0 items-center whitespace-nowrap rounded-md border px-3 text-xs font-medium transition-all duration-200 ease-in-out',
                isSelected
                  ? 'border-primary-border bg-primary-soft text-primary'
                  : 'border-border bg-surface text-foreground hover:bg-surface-raised'
              )}
            >
              {category.name}
            </button>
          );
        })}
      </div>

      {catalogState.loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-80 animate-pulse rounded-lg bg-surface-raised" />
          ))}
        </div>
      ) : catalogState.error ? (
        <EmptyState icon={Unplug} title="تعذر الاتصال بقاعدة البيانات" description={catalogState.error} />
      ) : filteredCourses.length === 0 ? (
        <EmptyState icon={FolderOpen} title="لا توجد كورسات متاحة" description="لم يتم نشر أي كورسات تعليمية في قاعدة البيانات حالياً." />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </PageShell>
  );
}
