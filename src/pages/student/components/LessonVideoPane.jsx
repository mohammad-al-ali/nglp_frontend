import { Link } from 'react-router-dom';
import { FileText, AlignLeft, Sparkles, ChevronUp, Video } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { resolveMediaUrl } from '../../../utils/constants';

export default function LessonVideoPane({ activeLesson, videoRef, showDetails, onToggleDetails, courseId, lessonId, onSmartPrompt }) {
  return (
    <main className="flex min-w-0 flex-1 flex-col gap-5 overflow-y-auto p-6">
      <section className="relative aspect-video max-h-[52vh] w-full overflow-hidden rounded-lg bg-slate-900 shadow-md">
        {activeLesson.videoUrl ? (
          <video ref={videoRef} key={activeLesson.id} src={resolveMediaUrl(activeLesson.videoUrl)} controls className="size-full object-contain" />
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-3 text-white">
            <div className="grid size-14 place-items-center rounded-full bg-white/10">
              <Video className="size-7 text-white/60" />
            </div>
            <strong className="text-lg font-bold">لم يتم رفع فيديو لهذا الدرس بعد</strong>
            <p className="text-sm text-slate-400">{activeLesson.title}</p>
          </div>
        )}
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-black text-foreground">{activeLesson.title}</h1>

        <div className="flex items-center gap-3">
          <Link
            to={`/study/${courseId}/lesson/${lessonId}/quizzes`}
            className="inline-flex h-9 items-center gap-2 rounded-full border border-success-border bg-success-soft px-4 text-sm font-bold text-success shadow-sm transition-all duration-200 ease-in-out hover:bg-success hover:text-white"
          >
            <FileText className="size-4" /> الاختبارات
          </Link>

          <button
            type="button"
            onClick={onSmartPrompt}
            className="inline-flex h-9 items-center gap-2 rounded-full border border-primary-border bg-primary-soft px-4 text-sm font-bold text-primary shadow-sm transition-all duration-200 ease-in-out hover:bg-primary hover:text-primary-foreground"
          >
            <Sparkles className="size-4" /> لم تفهم هذه النقطة؟
          </button>
        </div>
      </div>

      {showDetails && (
        <Card className="flex flex-col">
          <div className="flex items-center justify-between rounded-t-lg border-b border-border bg-surface-raised px-5 py-3.5">
            <h3 className="flex items-center gap-1.5 text-sm font-bold text-foreground">
              <FileText className="size-4" /> تفاصيل الدرس وتفريغ الفيديو
            </h3>
            <button type="button" onClick={onToggleDetails} className="flex items-center gap-1 text-sm font-bold text-muted-foreground hover:text-foreground">
              طوي <ChevronUp className="size-3.5" />
            </button>
          </div>

          <div className="flex flex-col gap-4.5 p-6">
            <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">{activeLesson.description || 'لا يوجد وصف تفصيلي متوفر لهذا الدرس.'}</p>

            <div className="border-t border-border pt-4">
              <h4 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-foreground">
                <AlignLeft className="size-4" /> تفريغ الفيديو التلقائي
              </h4>
              <div className="max-h-40 overflow-y-auto rounded-md border border-border bg-surface-raised p-4 text-sm leading-loose text-foreground">
                {activeLesson.transcript || 'لم يتم توليد تفريغ نصي تلقائي لهذا الفيديو بعد.'}
              </div>
            </div>
          </div>
        </Card>
      )}
    </main>
  );
}
