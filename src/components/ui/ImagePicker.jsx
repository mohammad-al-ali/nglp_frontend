import { useEffect, useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

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
    <div className="flex w-full flex-col gap-1.5">
      {label && <Label>{label}</Label>}

      <div
        onClick={() => inputRef.current?.click()}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={cn(
          'relative flex cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-lg border-2 border-dashed transition-all duration-200 ease-in-out',
          previewSrc ? 'min-h-40 p-0' : 'min-h-auto p-7',
          dragActive ? 'border-primary bg-primary-soft' : 'border-border bg-background'
        )}
      >
        <input ref={inputRef} type="file" accept="image/*" onChange={(e) => pickFile(e.target.files?.[0])} className="hidden" />

        {previewSrc ? (
          <>
            <img src={previewSrc} alt="" className="block h-40 w-full object-cover" />
            <button
              type="button"
              onClick={clearFile}
              className="absolute end-2 top-2 flex h-7 items-center gap-1 rounded-full border border-border bg-surface px-2.5 text-xs font-bold text-error"
            >
              <X className="size-3.5" /> إزالة
            </button>
          </>
        ) : (
          <>
            <div className="flex size-10 items-center justify-center rounded-full border border-border bg-surface shadow-sm">
              <ImagePlus className="size-[18px] text-muted-foreground" />
            </div>
            <span className="text-sm font-bold text-foreground">اسحب وأفلت صورة هنا أو انقر للاختيار</span>
          </>
        )}
      </div>

      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </div>
  );
}
