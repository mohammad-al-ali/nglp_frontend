import { useEffect, useState } from 'react';
import { GraduationCap, ShieldCheck, Sparkles, LayoutGrid, ListChecks, PlayCircle } from 'lucide-react';
import api from '../services/api';
import { categories as defaultCategories, courses as defaultCourses, normalizeCategory, normalizeCourse } from '../utils/constants';
import Hero from '@/components/home/Hero';
import CourseTabs from '@/components/home/CourseTabs';
import CategoryTiles from '@/components/home/CategoryTiles';
import FeatureBand from '@/components/home/FeatureBand';
import CtaBand from '@/components/home/CtaBand';

const GUIDES = [
  { icon: GraduationCap, title: 'تعلّم بالفيديو', desc: 'دروس مسجلة يمكنك مشاهدتها في وقتك الخاص.' },
  { icon: Sparkles, title: 'مساعد ذكي', desc: 'اسأل عن أي نقطة ولم تفهمها واحصل على شرح فوري.' },
  { icon: ListChecks, title: 'اختبارات قصيرة', desc: 'تأكد من فهمك بعد كل درس عبر اختبار سريع.' },
  { icon: ShieldCheck, title: 'وصول مجاني', desc: 'كل المحتوى متاح بالكامل بدون أي رسوم.' },
];

const HOW_IT_WORKS = [
  { icon: PlayCircle, title: 'شاهد الدرس', desc: 'فيديو واضح مع تفريغ نصي كامل لكل درس.' },
  { icon: Sparkles, title: 'اسأل المساعد', desc: 'لم تفهم نقطة؟ اسأل المساعد الذكي وهو يشرح فوراً.' },
  { icon: LayoutGrid, title: 'اختبر نفسك', desc: 'اختبار قصير في نهاية كل درس يقيس ما وصل فعلاً.' },
];

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

  const rootCategories = catalogState.categories.filter((category) => !category.parentId);

  return (
    <div className="font-sans">
      <Hero categories={rootCategories} />
      <CourseTabs courses={catalogState.courses} categories={rootCategories} />
      <CategoryTiles categories={rootCategories} courses={catalogState.courses} />
      <FeatureBand title="لماذا NGLP" items={GUIDES} variant="card" gray />
      <FeatureBand
        title="كيف تتعلم هنا"
        items={HOW_IT_WORKS}
        variant="plain"
        cta={[
          { question: 'عندك مادة تعليمية؟', label: 'ابدأ التدريس', to: '/register', icon: GraduationCap },
          { question: 'جاهز تتعلم؟', label: 'ابدأ التعلم', to: '/register', icon: Sparkles },
        ]}
      />
      <CtaBand />
    </div>
  );
}
