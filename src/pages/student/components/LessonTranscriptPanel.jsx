import { useEffect, useRef } from 'react';
import { AlignLeft } from 'lucide-react';
import Skeleton from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';

const LANGUAGE_LABELS = { ar: 'العربية', en: 'English' };

function formatTime(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds || 0));
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

/**
 * لوحة تفريغ الفيديو المتزامنة: تُبرز المقطع الحالي أثناء التشغيل، تُمرّر إليه
 * تلقائياً، والنقر على مقطع ينقل الفيديو إلى وقته. مبدّل اللغة يظهر فقط عندما
 * تتوفر أكثر من لغة فعلياً.
 */
export default function LessonTranscriptPanel({
  segments = [],
  activeIndex = -1,
  onSeek,
  language = 'ar',
  availableLanguages = [],
  onLanguageChange,
  loading = false,
  error = null,
}) {
  const activeRef = useRef(null);
  const isRtl = language !== 'en';

  useEffect(() => {
    // block:'nearest' لا يُمرّر إن كان المقطع ظاهراً أصلاً — تمرير غير مزعج.
    activeRef.current?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const showToggle = availableLanguages.length > 1;

  return (
    <div className="border-t border-border pt-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h4 className="flex items-center gap-1.5 text-sm font-bold text-foreground">
          <AlignLeft className="size-4" /> تفريغ الفيديو
        </h4>

        {showToggle ? (
          <div className="inline-flex overflow-hidden rounded-full border border-border" role="group" aria-label="لغة التفريغ">
            {availableLanguages.map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => lang !== language && onLanguageChange?.(lang)}
                aria-pressed={lang === language}
                className={cn(
                  'px-3 py-1 text-xs font-bold transition-colors',
                  lang === language
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-surface-raised text-muted-foreground hover:text-foreground'
                )}
              >
                {LANGUAGE_LABELS[lang] || lang}
              </button>
            ))}
          </div>
        ) : (
          availableLanguages.length === 1 && (
            <span className="text-xs font-bold text-muted-foreground">
              {LANGUAGE_LABELS[availableLanguages[0]] || availableLanguages[0]}
            </span>
          )
        )}
      </div>

      <div
        dir={isRtl ? 'rtl' : 'ltr'}
        className="max-h-56 space-y-0.5 overflow-y-auto rounded-md border border-border bg-surface-raised p-2 text-start"
      >
        {loading ? (
          <div className="p-2">
            <Skeleton count={5} height="16px" />
          </div>
        ) : error ? (
          <p className="p-3 text-sm text-error">{error}</p>
        ) : segments.length === 0 ? (
          <p className="p-3 text-sm leading-loose text-muted-foreground">
            لم يتم توليد تفريغ نصي لهذا الفيديو بعد.
          </p>
        ) : (
          segments.map((seg, i) => {
            const isActive = i === activeIndex;
            return (
              <button
                key={seg.index ?? i}
                type="button"
                ref={isActive ? activeRef : null}
                aria-current={isActive ? 'true' : undefined}
                onClick={() => onSeek?.(seg.startSecond)}
                className={cn(
                  'flex w-full items-start gap-2.5 rounded px-2 py-1.5 text-start text-sm leading-relaxed transition-colors',
                  isActive
                    ? 'bg-primary-soft font-medium text-primary'
                    : 'text-foreground hover:bg-border/40'
                )}
              >
                <span dir="ltr" className="mt-0.5 shrink-0 font-mono text-xs text-muted-foreground">
                  {formatTime(seg.startSecond)}
                </span>
                <span>{seg.text}</span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
