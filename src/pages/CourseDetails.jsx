import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api, { getCurrentUserId } from '../services/api';
import PageFrame from '../components/ui/PageFrame';
import ProgressBar from '../components/ui/ProgressBar';
import { normalizeCourse, normalizeLesson } from '../utils/constants';

export default function CourseDetails() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  
  // States strictly managed from active database Axios payloads with zero local mock fallbacks
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [enrollStatus, setEnrollStatus] = useState('idle'); // idle, saving, enrolled, error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadCourseDetails() {
      try {
        setLoading(true);
        setError(null);

        const [courseResponse, lessonsResponse] = await Promise.all([
          api.get(`/courses/${courseId}`),
          api.get('/lessons', { params: { courseId } }),
        ]);

        let userEnrolled = false;
        try {
          const userId = getCurrentUserId();
          if (userId) {
            const enrollResponse = await api.get('/enrollments', { params: { userId } });
            userEnrolled = enrollResponse.data.some(
              (enroll) => {
                const enrolledCourseId = enroll.courseId ?? enroll.course?.id;
                return Number(enrolledCourseId) === Number(courseId);
              }
            );
          }
        } catch (e) {
          console.warn('Failed to verify user enrollment status', e);
        }

        if (isMounted) {
          setCourse(normalizeCourse(courseResponse.data));
          setLessons(lessonsResponse.data.map((lesson) => normalizeLesson(lesson)));
          if (userEnrolled) {
            setEnrollStatus('enrolled');
          }
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load course details from database.', err);
        if (isMounted) {
          setError('تعذر تحميل تفاصيل الكورس من قاعدة البيانات. يرجى التحقق من اتصال الخادم.');
          setCourse(null);
          setLessons([]);
          setLoading(false);
        }
      }
    }

    loadCourseDetails();
    return () => {
      isMounted = false;
    };
  }, [courseId]);

  const startLesson = lessons[0];

  async function enrollInCourse() {
    if (enrollStatus === 'enrolled') {
      if (startLesson) {
        navigate(`/study-room/${course.id}/lesson/${startLesson.id}`);
      } else {
        navigate('/dashboard');
      }
      return;
    }

    setEnrollStatus('saving');
    const userId = getCurrentUserId();
    
    try {
      await api.post('/enrollments', null, {
        params: {
          userId: Number(userId),
          courseId: Number(courseId),
        }
      });
      setEnrollStatus('enrolled');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } catch (err) {
      console.error('Enrollment API request failed.', err);
      setEnrollStatus('error');
      alert('عذراً، فشلت عملية التسجيل في الكورس. يرجى التحقق من اتصال الخادم.');
    }
  }

  // Helper translations for level/difficulty
  const translateLevel = (lvl) => {
    if (!lvl) return 'جميع المستويات';
    const l = lvl.toLowerCase();
    if (l.includes('begin') || l.includes('مبتدئ')) return 'مبتدئ';
    if (l.includes('inter') || l.includes('متوسط')) return 'متوسط';
    if (l.includes('adv') || l.includes('متقدم')) return 'متقدم';
    return lvl;
  };

  if (loading) {
    return (
      <div 
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          width: '100vw', 
          height: '100vh', 
          backgroundColor: 'var(--bg)',
          color: 'var(--text-main)',
          direction: 'rtl'
        }}
      >
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '3px solid var(--primary-soft)', borderTopColor: 'var(--primary)', animation: 'spin 1s linear infinite', marginBottom: '16px' }} />
        <strong style={{ fontSize: '1.1rem', fontWeight: '800' }}>جاري تحميل تفاصيل الكورس...</strong>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  // Proper Database Connection / Course Details Not Found UI
  if (error || !course) {
    return (
      <div 
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          width: '100vw', 
          height: '100vh', 
          backgroundColor: 'var(--bg)',
          color: 'var(--text-main)',
          padding: '24px',
          textAlign: 'center',
          direction: 'rtl',
          fontFamily: 'var(--font-sans)'
        }}
      >
        <span style={{ fontSize: '3rem', marginBottom: '16px' }}>📂</span>
        <h2 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '12px' }}>تفاصيل الكورس غير متوفرة</h2>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', maxWidth: '480px', marginBottom: '24px', lineHeight: '1.6' }}>
          {error || 'عذراً، لم يتم العثور على هذا الكورس التعليمي في قاعدة البيانات.'}
        </p>
        <Link 
          to="/catalog"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '40px',
            padding: '0 20px',
            backgroundColor: 'var(--primary)',
            color: '#ffffff',
            borderRadius: 'var(--radius-md)',
            fontWeight: '700',
            textDecoration: 'none'
          }}
        >
          العودة لدليل الكورسات
        </Link>
      </div>
    );
  }

  return (
    <PageFrame
      eyebrow={course.category || 'تصنيف تعليمي'}
      title={course.title}
      actions={
        <span 
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            minHeight: '28px',
            padding: '0 12px',
            borderRadius: '999px',
            fontSize: '0.78rem',
            fontWeight: '800',
            backgroundColor: 'var(--primary-soft)',
            color: 'var(--primary)',
            border: '1px solid var(--primary-border)',
            direction: 'rtl'
          }}
        >
          ✨ مسار استكشاف المعرفة
        </span>
      }
    >
      {/* Inject custom responsive style overrides */}
      <style>{`
        .details-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 28px;
          align-items: start;
          direction: rtl;
          width: 100%;
        }
        @media (min-width: 992px) {
          .details-grid {
            grid-template-columns: minmax(0, 1.8fr) minmax(320px, 1fr);
          }
        }
        .sticky-card {
          position: static;
        }
        @media (min-width: 992px) {
          .sticky-card {
            position: sticky;
            top: 24px;
          }
        }
        .info-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px dashed var(--border);
        }
        .info-row:last-child {
          border-bottom: none;
        }
        .curriculum-card {
          transition: all var(--transition-fast);
        }
        .curriculum-card:hover {
          border-color: var(--primary-border) !important;
          background-color: var(--primary-soft) !important;
          transform: translateY(-2px);
        }
      `}</style>

      <div className="details-grid">
        {/* Right Pane: Course curriculum syllabus & full metadata description */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Main Description */}
          <div 
            className="premium-card"
            style={{
              backgroundColor: 'var(--surface)',
              padding: '28px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', fontFamily: 'var(--font-display)', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📝</span> وصف الكورس التدريبي
            </h2>
            <p style={{ fontSize: '0.94rem', color: 'var(--text-main)', lineHeight: '1.7', whiteSpace: 'pre-line' }}>
              {course.description || 'لم يتم إضافة وصف تفصيلي لهذا الكورس بعد.'}
            </p>
            {enrollStatus === 'enrolled' && (
              <div style={{ marginTop: '14px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)' }}>
                  <span>نسبة تقدمك في الدراسة</span>
                  <span>{course.progress || 0}%</span>
                </div>
                <ProgressBar value={course.progress || 0} />
              </div>
            )}
          </div>

          {/* Curriculum / Syllabus List */}
          <div 
            className="premium-card"
            style={{
              backgroundColor: 'var(--surface)',
              padding: '28px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '800', fontFamily: 'var(--font-display)', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <span>📚</span> منهج الدراسة والدروس
              </h2>
              <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--primary)', backgroundColor: 'var(--primary-soft)', padding: '4px 10px', borderRadius: 'var(--radius-full)' }}>
                {lessons.length} دروس منشورة
              </span>
            </div>

            {lessons.length === 0 ? (
              <div style={{ padding: '40px 16px', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--surface-raised)' }}>
                <span style={{ fontSize: '2rem' }}>📖</span>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '8px', fontWeight: '600' }}>لا توجد دروس منشورة لهذا الكورس التعليمي بعد.</p>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>سيقوم المعلم بإضافة محتوى الدروس قريباً.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {lessons.map((lesson, index) => {
                  const lessonPath = `/study-room/${course.id}/lesson/${lesson.id}`;
                  const isLinkable = enrollStatus === 'enrolled';
                  
                  const content = (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <span 
                          style={{ 
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '28px',
                            height: '28px',
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: 'var(--primary-soft)',
                            color: 'var(--primary)',
                            fontSize: '0.8rem', 
                            fontWeight: '800' 
                          }}
                        >
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'right' }}>
                          <strong style={{ fontSize: '0.92rem', color: 'var(--text-main)' }}>
                            {lesson.title}
                          </strong>
                          {lesson.description && (
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '500', display: '-webkit-box', WebkitLineClamp: '1', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {lesson.description}
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: '700' }}>
                          {lesson.duration || '00:00'}
                        </span>
                        {!isLinkable && (
                          <span style={{ fontSize: '0.88rem' }} title="يتطلب التسجيل في الكورس">🔒</span>
                        )}
                      </div>
                    </div>
                  );

                  if (isLinkable) {
                    return (
                      <Link 
                        className="curriculum-card" 
                        key={lesson.id} 
                        to={lessonPath}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '14px 18px',
                          backgroundColor: 'var(--surface)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-md)',
                          textDecoration: 'none',
                          transition: 'all var(--transition-fast)'
                        }}
                      >
                        {content}
                      </Link>
                    );
                  }

                  return (
                    <div 
                      key={lesson.id} 
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '14px 18px',
                        backgroundColor: 'var(--surface-raised)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)',
                        opacity: 0.85
                      }}
                    >
                      {content}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Left Pane: Sticky course overview statistics card with prominent enroll button */}
        <div className="sticky-card">
          <div 
            className="premium-card"
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}
          >
            {/* Header Badge */}
            <div style={{ display: 'flex', alignItems: 'center', justifySelf: 'center', gap: '10px', alignSelf: 'center', marginBottom: '4px' }}>
              <span 
                style={{ 
                  display: 'inline-flex',
                  alignItems: 'center',
                  minHeight: '26px',
                  padding: '0 12px',
                  color: 'var(--success)',
                  backgroundColor: 'var(--success-soft)',
                  border: '1px solid var(--success-border)',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.8rem',
                  fontWeight: '800'
                }}
              >
                ✓ وصول فوري للمحتوى
              </span>
            </div>

            {/* Course Title and Level Info */}
            <div style={{ textAlign: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '4px' }}>بوابة التسجيل الإلكتروني</div>
              <div style={{ fontSize: '1.6rem', fontWeight: '900', color: 'var(--primary)', fontFamily: 'var(--font-display)' }}>
                مجاني بالكامل
              </div>
            </div>

            {/* Statistics details container */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="info-row">
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>📊 المستوى الموصى به:</span>
                <span style={{ fontSize: '0.88rem', color: 'var(--text-main)', fontWeight: '800' }}>
                  {translateLevel(course.level)}
                </span>
              </div>
              <div className="info-row">
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>⏱️ المدة التقديرية:</span>
                <span style={{ fontSize: '0.88rem', color: 'var(--text-main)', fontWeight: '800' }}>
                  {course.durationSeconds ? `${Math.round(course.durationSeconds / 3600)} ساعة` : 'دراسة ذاتية'}
                </span>
              </div>
              <div className="info-row">
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>👥 الطلاب المستفيدون:</span>
                <span style={{ fontSize: '0.88rem', color: 'var(--text-main)', fontWeight: '800' }}>
                  {course.students?.toLocaleString() ?? 0} طالب
                </span>
              </div>
              <div className="info-row">
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>📁 إجمالي الدروس:</span>
                <span style={{ fontSize: '0.88rem', color: 'var(--text-main)', fontWeight: '800' }}>
                  {lessons.length} درس
                </span>
              </div>
              <div className="info-row">
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>🎓 شهادة إتمام:</span>
                <span style={{ fontSize: '0.88rem', color: 'var(--success)', fontWeight: '800' }}>✓ متوفرة</span>
              </div>
            </div>

            {/* Premium action button */}
            <div style={{ marginTop: '8px' }}>
              <button 
                onClick={enrollInCourse} 
                disabled={enrollStatus === 'saving'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  minHeight: '48px',
                  border: '1px solid transparent',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: '800',
                  fontSize: '0.96rem',
                  cursor: enrollStatus === 'saving' ? 'not-allowed' : 'pointer',
                  backgroundColor: enrollStatus === 'enrolled' ? 'var(--success)' : 'var(--primary)',
                  color: '#ffffff',
                  boxShadow: 'var(--shadow-md)',
                  transition: 'all var(--transition-fast)'
                }}
                onMouseEnter={(e) => {
                  if (enrollStatus !== 'saving') {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                }}
              >
                {enrollStatus === 'enrolled' 
                  ? '✓ ابدأ التعلم الآن (مسجل بالفعل)' 
                  : enrollStatus === 'saving' 
                    ? 'جاري تسجيلك في الكورس...' 
                    : 'سجل الآن في الكورس'}
              </button>

              {enrollStatus !== 'enrolled' && (
                <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '10px', fontWeight: '500' }}>
                  ⚡ عند الضغط على "سجل الآن" سيتم إضافتك فوراً وتوجيهك إلى مساحة التعلم.
                </p>
              )}
            </div>

            {/* Back Button */}
            <Link 
              to="/catalog"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                minHeight: '38px',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                fontWeight: '700',
                fontSize: '0.85rem',
                backgroundColor: 'var(--surface-raised)',
                color: 'var(--text-main)',
                textDecoration: 'none',
                transition: 'all var(--transition-fast)'
              }}
            >
              ⬅️ العودة لدليل الكورسات
            </Link>

          </div>
        </div>
      </div>
    </PageFrame>
  );
}
