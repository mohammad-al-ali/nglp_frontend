import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import PageFrame from '../components/ui/PageFrame';
import CourseGrid from '../components/CourseGrid';
import { categoryMatches, normalizeCategory, normalizeCourse } from '../utils/constants';

export default function CourseCatalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // States strictly managed from active Axios API responses with zero local mock arrays
  const [catalogState, setCatalogState] = useState({
    categories: [],
    courses: [],
    loading: true,
    error: null
  });
  
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get('category') || 'all'
  );

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
            categories: liveCategories,
            courses: liveCourses,
            loading: false,
            error: null
          });
        }
      } catch (err) {
        console.error('Failed to load database catalog from backend.', err);
        if (isMounted) {
          setCatalogState({
            categories: [],
            courses: [],
            loading: false,
            error: 'تعذر تحميل الكورسات والتصنيفات من قاعدة البيانات. يرجى التحقق من اتصال الخادم.'
          });
        }
      }
    }
    loadCatalog();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter courses by selected category
  const filteredCourses = catalogState.courses.filter((course) => 
    categoryMatches(course, selectedCategory, catalogState.categories)
  );

  return (
    <PageFrame 
      eyebrow="دليل الكورسات التعليمية" 
      title="استكشف الكورسات والمسارات" 
      actions={
        catalogState.error ? (
          <span 
            className="data-source"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              minHeight: '26px',
              padding: '0 12px',
              color: '#b91c1c',
              backgroundColor: '#fef2f2',
              border: '1px solid #fee2e2',
              borderRadius: '999px',
              fontSize: '0.72rem',
              fontWeight: '800',
              direction: 'rtl'
            }}
          >
            ⚠️ خطأ في الاتصال بالخادم
          </span>
        ) : null
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', direction: 'rtl' }}>
        
        {/* Horizontal Category Chips (IDE Syntax Bar Style) */}
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            padding: '12px 16px',
            backgroundColor: 'var(--surface-raised)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            overflowX: 'auto',
            whiteSpace: 'nowrap',
            marginBottom: '24px',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          <span style={{ fontSize: '0.78rem', fontWeight: '800', color: 'var(--text-muted)', marginLeft: '12px', flexShrink: 0 }}>
            🏷️ التصنيف:
          </span>
          
          <button 
            onClick={() => {
              setSelectedCategory('all');
              setSearchParams({});
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              minHeight: '32px',
              padding: '0 14px',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              fontWeight: '700',
              fontSize: '0.8rem',
              backgroundColor: selectedCategory === 'all' ? 'var(--primary-soft)' : 'var(--surface)',
              color: selectedCategory === 'all' ? 'var(--primary)' : 'var(--text-main)',
              borderColor: selectedCategory === 'all' ? 'var(--primary-border)' : 'var(--border)',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)'
            }}
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
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  minHeight: '32px',
                  padding: '0 14px',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: '600',
                  fontSize: '0.8rem',
                  backgroundColor: isSelected ? 'var(--primary-soft)' : 'var(--surface)',
                  color: isSelected ? 'var(--primary)' : 'var(--text-main)',
                  borderColor: isSelected ? 'var(--primary-border)' : 'var(--border)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)'
                }}
              >
                {category.name}
              </button>
            );
          })}
        </div>

        {/* Catalog Course Grid display */}
        <div>
          {catalogState.loading ? (
            <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
              {[1, 2, 3].map((n) => (
                <div className="premium-card animate-pulse" key={n} style={{ height: '300px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }} />
              ))}
            </div>
          ) : catalogState.error ? (
            /* Server database connection failure UI */
            <div style={{ padding: '60px 20px', textAlign: 'center', backgroundColor: 'var(--surface)', border: '1px dashed var(--border)', borderRadius: 'var(--radius-lg)' }}>
              <span style={{ fontSize: '2.5rem' }}>🔌</span>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginTop: '12px', color: 'var(--text-main)' }}>تعذر الاتصال بقاعدة البيانات</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                {catalogState.error}
              </p>
            </div>
          ) : filteredCourses.length === 0 ? (
            /* Empty Database State UI in Arabic RTL */
            <div style={{ padding: '60px 20px', textAlign: 'center', backgroundColor: 'var(--surface)', border: '1px dashed var(--border)', borderRadius: 'var(--radius-lg)' }}>
              <span style={{ fontSize: '2.2rem' }}>📂</span>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginTop: '12px', color: 'var(--text-main)' }}>لا توجد كورسات متاحة</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>لم يتم نشر أي كورسات تعليمية في قاعدة البيانات حالياً.</p>
            </div>
          ) : (
            <CourseGrid coursesToShow={filteredCourses} />
          )}
        </div>
      </div>
    </PageFrame>
  );
}
