
/**
 * Standard layout page container with modern heading styling
 */
export default function PageFrame({ eyebrow, title, actions, children }) {
  return (
    <section 
      style={{ 
        width: 'min(1240px, calc(100% - 48px))',
        margin: '0 auto',
        padding: '48px 0 72px 0',
        fontFamily: 'var(--font-sans)',
        animation: 'slideIn var(--transition-normal) forwards'
      }}
    >
      <div 
        style={{ 
          display: 'flex', 
          alignItems: 'flex-end', 
          justifyContent: 'space-between', 
          gap: '24px', 
          marginBottom: '32px',
          borderBottom: '1px solid var(--border)',
          paddingBottom: '20px'
        }}
      >
        <div>
          {eyebrow && (
            <p 
              style={{ 
                margin: '0 0 6px',
                color: 'var(--primary)',
                fontSize: '0.78rem',
                fontWeight: '800',
                textTransform: 'uppercase',
                letterSpacing: '0.08em'
              }}
            >
              {eyebrow}
            </p>
          )}
          <h1 
            style={{ 
              margin: '0', 
              color: 'var(--text-main)', 
              fontSize: '2.2rem',
              fontWeight: '800',
              fontFamily: 'var(--font-display)',
              lineHeight: '1.15'
            }}
          >
            {title}
          </h1>
        </div>
        {actions && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {actions}
          </div>
        )}
      </div>
      <div>
        {children}
      </div>
    </section>
  );
}
