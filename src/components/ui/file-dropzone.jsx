import { useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * Drag/drop + click-to-browse file target. Replaces the two byte-for-
 * byte-identical dropzones in CourseBuilder and ManageLessons.
 */
export default function FileDropzone({ accept, multiple = false, onFiles, icon: Icon, title, hint }) {
  const [dragActive, setDragActive] = useState(false);

  function handleDrag(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.length) onFiles(e.dataTransfer.files);
  }

  return (
    <label
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      className={cn(
        'flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed p-8 text-center transition-all duration-200 ease-in-out',
        dragActive ? 'border-primary bg-primary-soft' : 'border-border bg-background'
      )}
    >
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        onChange={(e) => e.target.files?.length && onFiles(e.target.files)}
      />
      {Icon && (
        <div className="flex size-11 items-center justify-center rounded-full border border-border bg-surface">
          <Icon className="size-5 text-muted-foreground" />
        </div>
      )}
      <div>
        <strong className="block text-sm font-semibold text-foreground">{title}</strong>
        {hint && <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>}
      </div>
    </label>
  );
}
