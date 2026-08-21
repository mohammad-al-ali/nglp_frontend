import { BookOpen, Clock, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LessonNavPanel({ show, onClose, lessons, activeLessonId, onNavigate }) {
  return (
    <aside
      className={cn(
        'flex shrink-0 flex-col overflow-hidden bg-surface transition-[width] duration-300 ease-in-out',
        show ? 'w-[280px] border-s border-border' : 'w-0'
      )}
    >
      <div className="flex h-full w-[280px] flex-col">
        <div className="flex items-center justify-between border-b border-border px-4.5 py-3.5">
          <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-muted-foreground">
            <BookOpen className="size-3.5" /> المنهج ({lessons.length})
          </span>
          <button type="button" onClick={onClose} className="text-muted-foreground transition-colors duration-200 ease-in-out hover:text-foreground">
            <X className="size-3.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {lessons.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">لا توجد دروس متوفرة منهجياً.</p>
          ) : (
            lessons.map((lesson, index) => {
              const isActive = String(lesson.id) === String(activeLessonId);
              return (
                <button
                  key={lesson.id}
                  type="button"
                  onClick={() => onNavigate(lesson.id)}
                  className={cn(
                    'my-0.5 flex w-full items-center gap-2.5 rounded-md border px-3.5 py-3 text-start transition-all duration-200 ease-in-out',
                    isActive ? 'border-primary-border bg-primary-soft' : 'border-transparent hover:bg-surface-raised'
                  )}
                >
                  <span
                    className={cn(
                      'grid size-[22px] shrink-0 place-items-center rounded-full border text-xs font-bold',
                      isActive ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-surface-raised text-muted-foreground'
                    )}
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1 text-start">
                    <strong className={cn('block truncate text-sm font-semibold', isActive ? 'text-primary' : 'text-foreground')}>{lesson.title}</strong>
                    <small className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                      <Clock className="size-3" /> {lesson.duration || '00:00'}
                    </small>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </aside>
  );
}
