import { useEffect, useRef, useState } from 'react';

/**
 * صورة واحدة قابلة للسحب والإفلات مع معاينة فورية.
 * onChange يُستدعى بملف الصورة المختار (أو null عند الإزالة).
 */
export default function ImagePicker({ label, hint, onChange, existingUrl }) {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

  const localPreview = file ? URL.createObjectURL(file) : null;
  const previewSrc = localPreview || existingUrl || null;

  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  function pickFile(nextFile) {
    if (!nextFile || !nextFile.type.startsWith('image/')) return;
    setFile(nextFile);
    onChange(nextFile);
  }

  function handleDrag(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    pickFile(e.dataTransfer.files?.[0]);
  }

  function clearFile(e) {
    e.stopPropagation();
    setFile(null);
    onChange(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
      {label && (
        <label style={{ color: 'var(--text-main)', fontSize: '0.875rem', fontWeight: '600', fontFamily: 'var(--font-sans)' }}>
          {label}
        </label>
      )}

      <div
        onClick={() => inputRef.current?.click()}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${dragActive ? 'var(--primary)' : 'var(--border)'}`,
          borderRadius: 'var(--radius-lg)',
          padding: previewSrc ? '0' : '28px 20px',
          textAlign: 'center',
          backgroundColor: dragActive ? 'var(--primary-soft)' : 'var(--bg)',
          transition: 'all var(--transition-fast)',
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          minHeight: previewSrc ? '160px' : 'auto',
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={(e) => pickFile(e.target.files?.[0])}
          style={{ display: 'none' }}
        />

        {previewSrc ? (
          <>
            <img
              src={previewSrc}
              alt=""
              style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block' }}
            />
            <button
              type="button"
              onClick={clearFile}
              style={{
                position: 'absolute',
                top: '8px',
                insetInlineEnd: '8px',
                minHeight: '28px',
                padding: '0 10px',
                fontSize: '0.75rem',
                fontWeight: '700',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface)',
                color: 'var(--error)',
                cursor: 'pointer',
              }}
            >
              إزالة
            </button>
          </>
        ) : (
          <>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" style={{ width: '18px', height: '18px', color: 'var(--text-muted)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18-3.75h16.5a1.5 1.5 0 0 1 1.5 1.5v10.5a1.5 1.5 0 0 1-1.5 1.5H3.75a1.5 1.5 0 0 1-1.5-1.5V6a1.5 1.5 0 0 1 1.5-1.5Z" />
              </svg>
            </div>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-main)', fontWeight: '700' }}>
              اسحب وأفلت صورة هنا أو انقر للاختيار
            </span>
          </>
        )}
      </div>

      {hint && (
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{hint}</span>
      )}
    </div>
  );
}
