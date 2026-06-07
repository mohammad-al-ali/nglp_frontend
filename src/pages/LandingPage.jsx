import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api from '../services/api';
import { categories as defaultCategories, courses as defaultCourses, categoryMatches, normalizeCategory, normalizeCourse } from '../utils/constants';
import CourseGrid from '../components/CourseGrid';

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
      {/* Premium Hero Section */}
      <section 
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '48px',
          alignItems: 'center',
          minHeight: 'calc(80vh - var(--header-height))',
          padding: '60px max(24px, calc((100vw - 1200px) / 2))',
          background: 'linear-gradient(180deg, #ffffff 0%, var(--bg) 100%)'
        }}
      >
        <div style={{ maxWidth: '620px' }}>
          <p 
            style={{
              margin: '0 0 12px',
              color: 'var(--primary)',
              fontSize: '0.85rem',
              fontWeight: '800',
              textTransform: 'uppercase',
              letterSpacing: '0.08em'
            }}
          >
            منصة NGLP التعليمية
          </p>
          <h1 
            style={{
              fontSize: 'clamp(2.8rem, 5vw, 4.5rem)',
              fontFamily: 'var(--font-display)',
              lineHeight: '1.1',
              color: 'var(--text-main)',
              marginBottom: '20px'
            }}
          >
            تعلم بذكاء مع<br/>
            <span style={{ 
              background: 'linear-gradient(90deg, var(--primary) 0%, #10b981 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: '800'
            }}>المساعد الذكي</span>
          </h1>
          <p style={{ fontSize: '1.15rem', color: 'var(--text-muted)', marginBottom: '36px', lineHeight: '1.6' }}>
            بيئة تعليمية متكاملة تدمج بين الدروس المرئية، النصوص المفرغة، والمساعد الذكي (AI Tutor) لتمنحك تجربة دراسية تفاعلية غير مسبوقة.
          </p>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <Link 
              className="primary-button" 
              to="/catalog"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '46px',
                padding: '0 24px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--primary)',
                color: 'var(--text-inverse)',
                fontWeight: '700',
                transition: 'all var(--transition-fast)'
              }}
            >
              استكشف الكورسات
            </Link>
            <Link 
              className="secondary-button" 
              to="/dashboard"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '46px',
                padding: '0 24px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface)',
                color: 'var(--text-main)',
                fontWeight: '700',
                transition: 'all var(--transition-fast)'
              }}
            >
              متابعة التعلم
            </Link>
          </div>
        </div>

        {/* Premium Graphic Illustration */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div 
            className="glassmorphic"
            style={{ 
              width: '100%', 
              maxWidth: '520px', 
              borderRadius: 'var(--radius-lg)', 
              boxShadow: 'var(--shadow-premium)', 
              border: '1px solid var(--border)',
              padding: '16px',
              animation: 'pulse 6s ease-in-out infinite'
            }}
          >
            <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--error)' }} />
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--warning)' }} />
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--success)' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateRows: '1fr auto', gap: '12px' }}>
              <div 
                style={{ 
                  aspectRatio: '16/10', 
                  backgroundColor: '#0f172a', 
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <div 
                  style={{ 
                    width: '54px', 
                    height: '54px', 
                    borderRadius: '50%', 
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid rgba(255,255,255,0.2)',
                    cursor: 'pointer'
                  }}
                >
                  <span style={{ display: 'block', width: '0', height: '0', borderTop: '8px solid transparent', borderBottom: '8px solid transparent', borderLeft: '14px solid white', marginLeft: '4px' }} />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '6px' }}>
                <div style={{ height: '12px', width: '40%', backgroundColor: '#e2e8f0', borderRadius: '6px' }} />
                <div style={{ height: '8px', width: '85%', backgroundColor: '#f1f5f9', borderRadius: '4px' }} />
                <div style={{ height: '8px', width: '65%', backgroundColor: '#f1f5f9', borderRadius: '4px' }} />
              </div>
            </div>
          </div>
        </div>
      </section>

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
                  minHeight: '100px',
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)'
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
