
/**
 * Premium dashboard metric card
 */
export default function StatCard({ label, value }) {
  return (
    <div 
      className="premium-card"
      style={{ 
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        padding: '24px',
        fontFamily: 'var(--font-sans)',
        minHeight: '110px',
        justifyContent: 'center'
      }}
    >
      <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </span>
      <strong style={{ fontSize: '2.4rem', fontWeight: '800', color: 'var(--text-main)', fontFamily: 'var(--font-display)', lineHeight: '1.1' }}>
        {value}
      </strong>
    </div>
  );
}
