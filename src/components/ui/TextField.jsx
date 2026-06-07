import React from 'react';

/**
 * Premium Text Field with floating/consistent layout and validation state
 */
export default function TextField({ label, value, onChange, type = 'text', error, placeholder }) {
  const inputId = React.useId();
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
      {label && (
        <label 
          htmlFor={inputId} 
          style={{ 
            color: 'var(--text-main)', 
            fontSize: '0.875rem', 
            fontWeight: '600',
            fontFamily: 'var(--font-sans)'
          }}
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        style={{
          width: '100%',
          minHeight: '44px',
          padding: '0 14px',
          fontSize: '0.95rem',
          color: 'var(--text-main)',
          backgroundColor: 'var(--surface)',
          border: error ? '1.5px solid var(--error)' : '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          outline: 'none',
          boxShadow: 'var(--shadow-sm)',
          transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)',
        }}
        onFocus={(e) => {
          if (!error) {
            e.target.style.borderColor = 'var(--border-focus)';
            e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.15)';
          }
        }}
        onBlur={(e) => {
          if (!error) {
            e.target.style.borderColor = 'var(--border)';
            e.target.style.boxShadow = 'var(--shadow-sm)';
          }
        }}
      />
      {error && (
        <span 
          style={{ 
            color: 'var(--error)', 
            fontSize: '0.8rem', 
            fontWeight: '500',
            animation: 'shiver 0.2s ease'
          }}
        >
          {error}
        </span>
      )}
    </div>
  );
}
