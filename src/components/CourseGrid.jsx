import { Link } from 'react-router-dom';

/**
 * Premium catalog course list component
 */
export default function CourseGrid({ coursesToShow = [] }) {
  return (
    <div 
      style={{ 
        display: 'grid', 
        gap: '24px',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        width: '100%'
      }}
    >
      {coursesToShow.map((course) => (
        <article 
          className="premium-card" 
          key={course.id}
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '18px',
            padding: '24px',
            minHeight: '310px',
            fontFamily: 'var(--font-sans)'
          }}
        >
          <div>
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                marginBottom: '14px' 
              }}
            >
              <span 
                style={{ 
                  display: 'inline-flex',
                  alignItems: 'center',
                  minHeight: '24px',
                  padding: '0 10px',
                  color: 'var(--success)',
                  backgroundColor: 'var(--success-soft)',
                  border: '1px solid var(--success-border)',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.78rem',
                  fontWeight: '700'
                }}
              >
                {course.category}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                {course.level}
              </span>
            </div>
            
            <h3 
              style={{ 
                fontSize: '1.25rem', 
                fontWeight: '700', 
                color: 'var(--text-main)', 
                marginBottom: '8px',
                lineHeight: '1.3'
              }}
            >
              {course.title}
            </h3>
            
            <p 
              style={{ 
                fontSize: '0.9rem', 
                color: 'var(--text-muted)',
                display: '-webkit-box',
                WebkitLineClamp: '3',
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                lineHeight: '1.5'
              }}
            >
              {course.description}
            </p>
          </div>

          <div>
            <div 
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                fontSize: '0.82rem', 
                color: 'var(--text-muted)', 
                fontWeight: '600',
                marginBottom: '18px',
                borderTop: '1px solid var(--border)',
                paddingTop: '14px'
              }}
            >
              <span>{course.lessonsCount ?? course.lessons?.length ?? 0} دروس</span>
              <span>{course.students?.toLocaleString() ?? 0} طالب مسجل</span>
            </div>
            
            <Link 
              className="secondary-button" 
              to={`/catalog/${course.id}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                minHeight: '40px',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                fontWeight: '700',
                fontSize: '0.9rem',
                backgroundColor: 'var(--surface)',
                color: 'var(--text-main)',
                transition: 'all var(--transition-fast)'
              }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = 'var(--primary-border)';
                e.target.style.color = 'var(--primary)';
                e.target.style.backgroundColor = 'var(--primary-soft)';
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = 'var(--border)';
                e.target.style.color = 'var(--text-main)';
                e.target.style.backgroundColor = 'var(--surface)';
              }}
            >
              استكشاف الكورس
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
