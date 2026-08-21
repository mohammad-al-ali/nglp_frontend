import { useEffect, useState } from 'react';
import api from '../services/api';
import { categories as defaultCategories, courses as defaultCourses, normalizeCategory, normalizeCourse } from '../utils/constants';
import Hero from '@/components/home/Hero';
import CategoryList from '@/components/home/CategoryList';
import CourseCard from '@/components/CourseCard';
import { Badge } from '@/components/ui/badge';

export default function LandingPage() {
  const [catalogState, setCatalogState] = useState({
    categories: defaultCategories,
    courses: defaultCourses,
    loading: true,
    source: 'sample',
  });

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
          setCatalogState({
            categories: liveCategories.length > 0 ? liveCategories : defaultCategories,
            courses: liveCourses.length > 0 ? liveCourses : defaultCourses,
            loading: false,
            source: 'backend',
          });
        }
      } catch (err) {
        console.warn('Failed to load live catalog from Spring Boot. Reverting to sample data.', err);
        if (isMounted) {
          setCatalogState({
            categories: defaultCategories,
            courses: defaultCourses,
            loading: false,
            source: 'sample',
          });
        }
      }
    }

    loadCatalog();
    return () => {
      isMounted = false;
    };
  }, []);

  const topCourses = catalogState.courses.slice(0, 3);
  const rootCategories = catalogState.categories.filter((category) => !category.parentId);

  return (
    <div className="font-sans">
      <Hero />

      {/* Categories */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="mb-2 font-mono text-xs font-medium uppercase tracking-wider text-primary">
              تصفّح حسب المجال
            </p>
            <h2 className="font-display text-2xl font-semibold text-foreground">التصنيفات المتاحة</h2>
          </div>
          {catalogState.source === 'sample' && <Badge variant="outline">بيانات تجريبية</Badge>}
        </div>

        <CategoryList categories={rootCategories} courses={catalogState.courses} />
      </section>

      {/* Top courses */}
      <section className="border-y border-border bg-surface">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-8">
            <p className="mb-2 font-mono text-xs font-medium uppercase tracking-wider text-primary">
              الأكثر متابعة
            </p>
            <h2 className="font-display text-2xl font-semibold text-foreground">كورسات مميزة</h2>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {topCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
