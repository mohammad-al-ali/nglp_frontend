import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api from '../services/api';
import { categories as defaultCategories, courses as defaultCourses, categoryMatches, normalizeCategory, normalizeCourse } from '../utils/constants';
import CourseGrid from '../components/CourseGrid';
import GlassHeroPreview from '../components/GlassHeroPreview';

export default function LandingPage() {
  const [catalogState, setCatalogState] = useState({ 
    categories: defaultCategories, 
    courses: defaultCourses, 
    loading: true, 
    source: 'sample' 
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
            source: 'sample' 
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

  return (
    <div style={{ fontFamily: 'var(--font-sans)', animation: 'slideIn var(--transition-normal) forwards' }}>
      <GlassHeroPreview />

      {/* Categories Grid Section */}
      <section style={{ padding: '72px max(24px, calc((100vw - 1200px) / 2))' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
          <div>
            <p style={{ margin: '0 0 6px', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Explore by focus</p>
            <h2 style={{ fontSize: '2rem', fontWeight: '800', fontFamily: 'var(--font-display)' }}>Available Categories</h2>
          </div>
          {catalogState.source === 'sample' && (
            <span className="data-source">Sample data</span>
          )}
        </div>

        <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {catalogState.categories
            .filter((category) => !category.parentId)
            .map((category) => (
              <Link 
                className="premium-card" 
                key={category.id} 
                to={`/catalog?category=${category.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '24px',
                  minHeight: '100px'
                }}
              >
                <div>
                  <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)', marginBottom: '4px' }}>{category.name}</h3>
                  <small style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                    {catalogState.courses.filter((course) => categoryMatches(course, category.id, catalogState.categories)).length} courses
                  </small>
                </div>
                <span style={{ fontSize: '1.3rem', color: 'var(--primary)' }}>&rarr;</span>
              </Link>
            ))}
        </div>
      </section>

      {/* Top Courses Section */}
      <section 
        style={{ 
          padding: '72px max(24px, calc((100vw - 1200px) / 2))',
          backgroundColor: 'var(--surface)',
          borderTop: '1px solid var(--border)',
          borderBottom: '1px solid var(--border)'
        }}
      >
        <div style={{ marginBottom: '32px' }}>
          <p style={{ margin: '0 0 6px', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Popular paths</p>
          <h2 style={{ fontSize: '2rem', fontWeight: '800', fontFamily: 'var(--font-display)' }}>Top Courses</h2>
        </div>
        <CourseGrid coursesToShow={topCourses} />
      </section>
    </div>
  );
}
