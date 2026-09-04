import { useCallback, useEffect, useRef, useState } from 'react';
import { AlignLeft, ArrowDownToLine, Play, Sparkles } from 'lucide-react';
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
 * تلقائياً، والنقر على مقطع ينقل الفيديو إلى وقته. مبدّل اللغة ثابت أعلى القائمة
 * ويظهر فقط عندما تتوفر أكثر من لغة. عند ابتعاد المستخدم عن المقطع الحالي بالتمرير
 * تظهر شارة "العودة إلى المقطع الحالي".
 */
export default function LessonTranscriptPanel({
  segments = [],
  activeIndex = -1,
  onSeek,
  language = 'ar',
  availableLanguages = [],
  onLanguageChange,
  onGenerate,
  loading = false,
  error = null,
}) {
  const scrollRef = useRef(null);
  const activeRef = useRef(null);
  const isRtl = language !== 'en';
  const [activeOffscreen, setActiveOffscreen] = useState(false);

  const scrollActiveIntoView = useCallback((behavior = 'smooth') => {
    activeRef.current?.scrollIntoView({ block: 'nearest', behavior });
  }, []);

  useEffect(() => {
    // تمرير غير مزعج: block:'nearest' لا يُحرّك القائمة إن كان المقطع ظاهراً أصلاً.
    scrollActiveIntoView('smooth');
  }, [activeIndex, scrollActiveIntoView]);

  const syncActiveVisibility = useCallback(() => {
    const container = scrollRef.current;
    const active = activeRef.current;
    if (!container || !active) {
      setActiveOffscreen(false);
      return;
    }
    const c = container.getBoundingClientRect();
    const a = active.getBoundingClientRect();
    setActiveOffscreen(a.bottom < c.top || a.top > c.bottom);
  }, []);

  useEffect(() => {
    syncActiveVisibility();
  }, [activeIndex, segments, syncActiveVisibility]);

  const showToggle = availableLanguages.length > 1;

  return (
    <div className="flex flex-col">
      {segments.length > 0 && (
        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <AlignLeft className="size-3.5" /> {segments.length} مقطع — انقر أيّ مقطع للانتقال إليه
        </p>
      )}

      <div className="relative flex flex-col">
        <div
          ref={scrollRef}
          onScroll={syncActiveVisibility}
          dir={isRtl ? 'rtl' : 'ltr'}
          className="max-h-[40vh] min-h-32 space-y-0.5 overflow-y-auto rounded-md border border-border bg-surface-raised p-2 text-start lg:max-h-[46vh]"
        >
          {showToggle && (
            <div className="sticky top-0 z-10 -mx-2 -mt-2 mb-1 flex justify-end border-b border-border bg-surface-raised/95 px-2 py-1.5 backdrop-blur">
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
                        : 'bg-surface text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {LANGUAGE_LABELS[lang] || lang}
                  </button>
                ))}
              </div>
            </div>
          )}

          {loading ? (
            <div className="p-2">
              <Skeleton count={6} height="16px" />
            </div>
          ) : error ? (
            <p className="p-3 text-sm text-error">{error}</p>
          ) : segments.length === 0 ? (
            <div className="flex flex-col items-center gap-3 p-6 text-center">
              <AlignLeft className="size-8 text-border" />
              <p className="text-sm leading-relaxed text-muted-foreground">
                لم يتم توليد تفريغ نصي لهذا الفيديو بعد.
              </p>
              {onGenerate && (
                <button
                  type="button"
                  onClick={onGenerate}
                  className="inline-flex h-8 items-center gap-1.5 rounded-full border border-primary-border bg-primary-soft px-3 text-xs font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  <Sparkles className="size-3.5" /> توليد التفريغ الآن
                </button>
              )}
            </div>
          ) : (
            segments.map((seg, i) => {
              const isActive = i === activeIndex;
              return (
                <button
                  key={seg.index ?? i}
                  type="button"
                  ref={isActive ? activeRef : null}
                  aria-current={isActive ? 'true' : undefined}
                  title="الانتقال إلى هذا التوقيت"
                  onClick={() => onSeek?.(seg.startSecond)}
                  className={cn(
                    'group flex w-full items-start gap-2.5 rounded px-2 py-1.5 text-start text-sm leading-relaxed transition-colors',
                    isActive ? 'bg-primary-soft font-medium text-primary' : 'text-foreground hover:bg-border/40'
                  )}
                >
                  <span dir="ltr" className="mt-0.5 flex shrink-0 items-center gap-1 font-mono text-xs text-muted-foreground">
                    <Play
                      className={cn(
                        'size-3 transition-opacity',
                        isActive ? 'opacity-100 text-primary' : 'opacity-0 group-hover:opacity-70'
                      )}
                    />
                    {formatTime(seg.startSecond)}
                  </span>
                  <span>{seg.text}</span>
                </button>
              );
            })
          )}
        </div>

        {activeOffscreen && (
          <button
            type="button"
            onClick={() => scrollActiveIntoView('smooth')}
            className="absolute inset-x-0 bottom-2 mx-auto inline-flex w-fit items-center gap-1.5 rounded-full border border-primary-border bg-primary px-3 py-1 text-xs font-bold text-primary-foreground shadow-soft-lg transition-all hover:bg-primary-hover"
          >
            <ArrowDownToLine className="size-3.5" /> العودة إلى المقطع الحالي
          </button>
        )}
      </div>
    </div>
  );
}
