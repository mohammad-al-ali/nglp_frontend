import { BookOpen, Clock, X, CheckCircle2, PlayCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import Skeleton from '@/components/ui/Skeleton';
import { formatDuration } from '../../../utils/constants';

/**
 * قائمة دروس الكورس داخل غرفة الدراسة (الـ Playlist).
 *
 * حالة كل درس تُشتق من ترتيب القائمة بالنسبة لآخر درس تمّت مشاهدته
 * (lastWatchedLessonId): ما قبله = مكتمل، هو = الحالي، ما بعده = لم يبدأ.
 * تقدير تقريبي — الطالب الذي يقفز بين الدروس لن تظهر كل الدروس الوسيطة كمكتملة.
 */
export default function LessonNavPanel({
  show,
  onClose,
  lessons,
  activeLessonId,
  lastWatchedLessonId,
  loading = false,
  onNavigate,
}) {
  const totalSeconds = lessons.reduce((sum, lesson) => sum + (lesson.durationSeconds || 0), 0);
  const hasAnyDuration = lessons.some((lesson) => lesson.durationSeconds > 0);

  const lastWatchedIndex = lastWatchedLessonId
    ? lessons.findIndex((lesson) => String(lesson.id) === String(lastWatchedLessonId))
    : -1;

  return (
    <aside
      className={cn(
        'flex shrink-0 flex-col overflow-hidden bg-surface transition-[width] duration-300 ease-in-out',
        show ? 'w-[280px] border-s border-border' : 'w-0'
      )}
    >
      <div className="flex h-full w-[280px] flex-col">
        <div className="flex items-center justify-between border-b border-border px-4.5 py-3.5">
          <span className="flex min-w-0 items-center gap-1.5 text-xs font-black uppercase tracking-wider text-muted-foreground">
            <BookOpen className="size-3.5 shrink-0" />
            <span className="truncate">
              المنهج ({lessons.length})
              {hasAnyDuration && (
                <span className="ms-1.5 font-mono font-bold text-foreground" dir="ltr">
                  {formatDuration(totalSeconds)}
                </span>
              )}
            </span>
          </span>
          <button
            type="button"
            onClick={onClose}
            title="إخفاء قائمة الدروس"
            className="shrink-0 text-muted-foreground transition-colors duration-200 ease-in-out hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {loading ? (
            <div className="space-y-2 p-1">
              <Skeleton count={6} height="46px" />
            </div>
          ) : lessons.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-2 py-10 text-center">
              <BookOpen className="size-8 text-border" />
              <p className="text-sm text-muted-foreground">لا توجد دروس متوفرة في هذا الكورس بعد.</p>
            </div>
          ) : (
            lessons.map((lesson, index) => {
              const isActive = String(lesson.id) === String(activeLessonId);
              const status =
                lastWatchedIndex === -1
                  ? 'todo'
                  : index < lastWatchedIndex
                    ? 'done'
                    : index === lastWatchedIndex
                      ? 'current'
                      : 'todo';

              return (
                <button
                  key={lesson.id}
                  type="button"
                  onClick={() => onNavigate(lesson.id)}
                  aria-current={isActive ? 'true' : undefined}
                  className={cn(
                    'my-0.5 flex w-full items-center gap-2.5 rounded-md border px-3.5 py-3 text-start transition-all duration-200 ease-in-out',
                    isActive
                      ? 'border-primary-border bg-primary-soft'
                      : 'border-transparent hover:border-border hover:bg-surface-raised'
                  )}
                >
                  <LessonStatusMark status={status} index={index} isActive={isActive} />

                  <div className="min-w-0 flex-1 text-start">
                    <strong
                      className={cn(
                        'block truncate text-sm font-semibold',
                        isActive ? 'text-primary' : status === 'done' ? 'text-muted-foreground' : 'text-foreground'
                      )}
                    >
                      {lesson.title}
                    </strong>
                    <small className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                      <Clock className="size-3" />
                      <span dir="ltr">{lesson.durationSeconds > 0 ? lesson.duration : '—:—'}</span>
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

function LessonStatusMark({ status, index, isActive }) {
  const base = 'grid size-[22px] shrink-0 place-items-center rounded-full border text-xs font-bold';

  if (status === 'done') {
    return (
      <span className={cn(base, 'border-success-border bg-success-soft text-success')}>
        <CheckCircle2 className="size-3.5" />
      </span>
    );
  }

  if (status === 'current' && !isActive) {
    return (
      <span className={cn(base, 'border-primary-border bg-primary-soft text-primary')}>
        <PlayCircle className="size-3.5" />
      </span>
    );
  }

  if (isActive) {
    return <span className={cn(base, 'border-primary bg-primary text-primary-foreground')}>{index + 1}</span>;
  }

  return (
    <span className={cn(base, 'border-border bg-surface-raised text-muted-foreground')}>{index + 1}</span>
  );
}
