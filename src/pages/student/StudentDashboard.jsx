import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { getCurrentUserId } from '../../services/api';
import PageFrame from '../../components/ui/PageFrame';
import StatCard from '../../components/ui/StatCard';
import { normalizeEnrollment } from '../../utils/constants';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    api.get('/enrollments', { params: { userId: getCurrentUserId() } })
      .then((response) => {
        if (isMounted) {
          setEnrollments(response.data.map(normalizeEnrollment));
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn('Failed to load enrollments from database.', err);
        if (isMounted) {
          setEnrollments([]);
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute enrolled courses strictly from the database enrollments response
  const enrolledCourses = enrollments.map((enrollment) => ({
    ...enrollment.course,
    progress: enrollment.progress,
    lastWatchedLessonId: enrollment.lastWatchedLesson?.id || null
  }));

  const handleContinueLearning = async (courseId, lastWatchedLessonId) => {
    if (lastWatchedLessonId) {
      navigate(`/study-room/${courseId}/lesson/${lastWatchedLessonId}`);
      return;
    }
    try {
      // Fetch the actual first lesson of this course from the database
      const response = await api.get('/lessons', { params: { courseId } });
      if (response.data && response.data.length > 0) {
        const firstLessonId = response.data[0].id;
        navigate(`/study-room/${courseId}/lesson/${firstLessonId}`);
      } else {
        // Fallback if no lessons are published yet
        navigate(`/study-room/${courseId}/lesson/1`);
      }
    } catch (err) {
      console.warn('Failed to load first lesson for navigation', err);
      navigate(`/study-room/${courseId}/lesson/1`);
    }
  };
  
  const visibleCourses = enrolledCourses;
  
  // Calculate dynamic database statistics
  const averageProgress = visibleCourses.length > 0
    ? Math.round(visibleCourses.reduce((sum, c) => sum + (c.progress || 0), 0) / visibleCourses.length)
    : 0;

  const activeCoursesCount = visibleCourses.filter(c => (c.progress || 0) > 0 && (c.progress || 0) < 100).length;

  const continueEnrollment = enrollments.find((e) => e.lastWatchedLesson) || enrollments[0];
  const continueCourse = continueEnrollment?.course || null;
  const continueLesson = continueEnrollment?.lastWatchedLesson || null;

  return (
    <PageFrame 
      eyebrow="مساحة الطالب التعليمية" 
      title="لوحة المتابعة" 
      actions={
        <Link 
          to="/profile"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            minHeight: '38px',
            padding: '0 16px',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            fontWeight: '700',
            fontSize: '0.85rem',
            backgroundColor: 'var(--surface)',
            color: 'var(--text-main)',
            textDecoration: 'none',
            boxShadow: 'var(--shadow-sm)',
            transition: 'all var(--transition-fast)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--surface-raised)';
            e.currentTarget.style.borderColor = 'var(--text-muted)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--surface)';
            e.currentTarget.style.borderColor = 'var(--border)';
          }}
        >
          الملف الشخصي
        </Link>
      }
    >
      {/* Welcome & Overall Stats Section */}
      <div 
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '24px', 
          marginBottom: '32px',
          direction: 'rtl'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main)', margin: '0', fontFamily: 'var(--font-display)' }}>
            مرحباً بك في مساحة التعلم الخاصة بك 👋
          </h2>
          <p style={{ margin: '0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            تابع تقدمك الدراسي واستكمل منهجك التعليمي للارتقاء بمهاراتك البرمجية.
          </p>
        </div>

        {/* Dynamic metrics from Axios response */}
        <div 
          style={{ 
            display: 'grid', 
            gap: '20px', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))'
          }}
        >
          <StatCard label="الكورسات المسجلة" value={`${visibleCourses.length} منهج`} />
          <StatCard label="الكورسات الجارية" value={`${activeCoursesCount} كورس نشط`} />
          <StatCard label="متوسط الإنجاز العام" value={`${averageProgress}%`} />
        </div>
      </div>

      {/* Resume Course Header Row (rendered only if student has active history) */}
      {continueLesson && continueCourse && (
        <section 
          className="premium-card"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '24px',
            marginBottom: '36px',
            padding: '30px',
            backgroundColor: 'var(--primary-soft)',
            border: '1px solid var(--primary-border)',
            borderRadius: 'var(--radius-lg)',
            flexWrap: 'wrap',
            direction: 'rtl'
          }}
        >
          <div>
            <p style={{ margin: '0 0 6px', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              استئناف التعلم الجاري
            </p>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '6px', fontFamily: 'var(--font-display)' }}>
              {continueLesson.title}
            </h2>
            <p style={{ margin: '0', fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '600' }}>
              المنهج: {continueCourse.title}
            </p>
          </div>
          <Link 
            to={`/study-room/${continueCourse.id}/lesson/${continueLesson.id}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '44px',
              padding: '0 24px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--primary)',
              color: 'var(--text-inverse)',
              fontWeight: '800',
              fontSize: '0.925rem',
              textDecoration: 'none',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.15)',
              transition: 'all var(--transition-fast)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--primary)'}
          >
            استئناف الدرس الآن
          </Link>
        </section>
      )}

      {/* Enrollments Grid List Header */}
      <h3 
        style={{ 
          fontSize: '1.25rem', 
          color: 'var(--text-main)', 
          marginBottom: '20px', 
          fontFamily: 'var(--font-display)',
          fontWeight: '800',
          direction: 'rtl'
        }}
      >
        كورساتك التعليمية المسجلة ({visibleCourses.length})
      </h3>
      
      {loading ? (
        <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', direction: 'rtl' }}>
          {[1, 2, 3].map((n) => (
            <div className="premium-card animate-pulse" key={n} style={{ height: '220px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      ) : visibleCourses.length === 0 ? (
        /* Proper Empty State UI in RTL Arabic */
        <div 
          style={{ 
            padding: '60px 20px', 
            textAlign: 'center', 
            backgroundColor: 'var(--surface)', 
            border: '1px dashed var(--border)', 
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '14px',
            direction: 'rtl'
          }}
        >
          <span style={{ fontSize: '3rem' }}>🎓</span>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>لم تسجل في أي كورس بعد</h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0, maxWidth: '420px', lineHeight: '1.6' }}>
            مساحة التعلم الخاصة بك فارغة حالياً. ابدأ رحلتك التعليمية الآن واستكشف دليل الكورسات المتاحة للتسجيل والبدء فوراً.
          </p>
          <Link 
            to="/catalog"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '42px',
              padding: '0 24px',
              backgroundColor: 'var(--primary)',
              color: '#ffffff',
              borderRadius: 'var(--radius-md)',
              fontWeight: '800',
              fontSize: '0.9rem',
              textDecoration: 'none',
              boxShadow: 'var(--shadow-sm)',
              marginTop: '6px'
            }}
          >
            تصفح دليل الكورسات 🚀
          </Link>
        </div>
      ) : (
        <div 
          style={{ 
            display: 'grid', 
            gap: '24px', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            direction: 'rtl'
          }}
        >
          {visibleCourses.map((course) => (
            <article 
              className="premium-card" 
              key={course.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '18px',
                padding: '24px',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-sm)',
                transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <span 
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      minHeight: '22px',
                      padding: '0 10px',
                      color: 'var(--primary)',
                      backgroundColor: 'var(--primary-soft)',
                      border: '1px solid var(--primary-border)',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.72rem',
                      fontWeight: '800'
                    }}
                  >
                    {course.category}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                    ⚡ {course.level || 'جميع المستويات'}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '8px', lineHeight: '1.4' }}>
                  {course.title}
                </h3>
                
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {course.description}
                </p>
              </div>

              <div>
                {/* Glassmorphic progress tracker */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-main)' }}>
                    <span>نسبة الإنجاز</span>
                    <span style={{ color: 'var(--primary)' }}>{course.progress || 0}%</span>
                  </div>
                  <div 
                    style={{ 
                      width: '100%', 
                      height: '8px', 
                      backgroundColor: 'rgba(37, 99, 235, 0.06)', 
                      border: '1px solid rgba(37, 99, 235, 0.1)',
                      borderRadius: 'var(--radius-full)',
                      overflow: 'hidden',
                      backdropFilter: 'blur(4px)'
                    }}
                  >
                    <div 
                      style={{ 
                        width: `${course.progress || 0}%`, 
                        height: '100%', 
                        background: 'linear-gradient(90deg, var(--primary) 0%, var(--primary-hover) 100%)',
                        borderRadius: 'var(--radius-full)',
                        transition: 'width var(--transition-normal)'
                      }}
                    />
                  </div>
                </div>

                {/* Actions Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {/* Dynamic study room route redirection */}
                  <button 
                    onClick={() => handleContinueLearning(course.id, course.lastWatchedLessonId)}
                    style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: '38px',
                      backgroundColor: 'var(--primary)',
                      color: 'var(--text-inverse)',
                      border: 'none',
                      borderRadius: 'var(--radius-md)',
                      fontWeight: '700',
                      fontSize: '0.825rem',
                      cursor: 'pointer',
                      boxShadow: 'var(--shadow-sm)',
                      transition: 'all var(--transition-fast)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--primary)'}
                  >
                    متابعة التعلم
                  </button>
                  <Link 
                    to={`/catalog/${course.id}`}
                    style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: '38px',
                      backgroundColor: 'var(--surface-raised)',
                      color: 'var(--text-main)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      fontWeight: '700',
                      fontSize: '0.825rem',
                      textDecoration: 'none',
                      transition: 'all var(--transition-fast)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--surface)';
                      e.currentTarget.style.borderColor = 'var(--primary-border)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--surface-raised)';
                      e.currentTarget.style.borderColor = 'var(--border)';
                    }}
                  >
                    تفاصيل المنهج
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </PageFrame>
  );
}
