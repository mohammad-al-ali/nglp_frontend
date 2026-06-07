
/**
 * Premium glassmorphic progress bar
 */
export default function ProgressBar({ value = 0 }) {
  const percent = Math.min(Math.max(value, 0), 100);
  
  return (
    <div 
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '6px', 
        width: '100%',
        fontFamily: 'var(--font-sans)'
      }}
      aria-label={`Progress ${percent}%`}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-muted)' }}>Progress</span>
        <strong style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--primary)' }}>{percent}%</strong>
      </div>
      <div 
        style={{ 
          height: '10px', 
          width: '100%',
          overflow: 'hidden', 
          backgroundColor: 'var(--surface-raised)', 
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-full)',
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.03)'
        }}
      >
        <span 
          style={{ 
            display: 'block', 
            height: '100%', 
            width: `${percent}%`,
            background: 'linear-gradient(90deg, var(--primary) 0%, #10b981 100%)', 
            borderRadius: 'inherit',
            transition: 'width var(--transition-normal) ease-out',
            boxShadow: '0 1px 2px rgba(37, 99, 235, 0.2)'
          }} 
        />
      </div>
    </div>
  );
}
