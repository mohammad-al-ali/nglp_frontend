import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Sparkles, ChevronUp, Video, ArrowRight, ArrowLeft, AlignLeft, BookText } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { resolveMediaUrl } from '../../../utils/constants';
import LessonTranscriptPanel from './LessonTranscriptPanel';

export default function LessonVideoPane({
  activeLesson,
  videoRef,
  showDetails,
  onToggleDetails,
  courseId,
  lessonId,
  onSmartPrompt,
  onTimeUpdate,
  onLoadedMetadata,
  onPlay,
  onEnded,
  prevLessonId,
  nextLessonId,
  onNavigateLesson,
  transcript,
}) {
  const hasTranscript = (transcript?.segments?.length ?? 0) > 0;
  const [detailsTab, setDetailsTab] = useState(hasTranscript ? 'transcript' : 'about');

  // ضبط التبويب الافتراضي عند تبديل الدرس (نمط "تعديل الحالة أثناء العرض" الموصى به من React):
  // تبويب التفريغ إن توفّر، وإلا النبذة.
  const [seenLessonId, setSeenLessonId] = useState(activeLesson.id);
  if (activeLesson.id !== seenLessonId) {
    setSeenLessonId(activeLesson.id);
    setDetailsTab(hasTranscript ? 'transcript' : 'about');
  }

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-4 overflow-y-auto overflow-x-hidden p-4 sm:gap-5 sm:p-6">
      {/*
       * لا نفرض صندوقاً بنسبة 16:9 ثابتة هنا: أي فيديو بنسبة أبعاد مختلفة
       * (عمودي، 4:3، ...) كان يُعرض بحجمه الحقيقي داخل هذا الصندوق الثابت عبر
       * object-contain، تاركاً شريطين أسودين فارغين على الجانبين. بترك القسم
       * كحاوية توسيط فقط، وتحديد أقصى ارتفاع/عرض على الفيديو نفسه دون فرض عرض
       * أو ارتفاع صريح، يحسب المتصفح حجم المشغل تلقائياً بنفس نسبة أبعاد الفيديو
       * الأصلية، فلا تظهر أي حواف فارغة حول الفيديو.
       *
       * الارتفاع الأقصى متجاوب: أصغر على الشاشات القصيرة كي لا يزاحم بطاقة
       * التفاصيل، ويعود إلى 52vh على الشاشات الكبيرة (lg). shrink-0 ضروري كي لا
       * يقلّص Flexbox القسم دون علمٍ بارتفاع الفيديو المستقل داخله.
       */}
      <section className="relative flex h-[40vh] w-full shrink-0 items-center justify-center overflow-hidden sm:h-[46vh] lg:h-[52vh]">
        {activeLesson.videoUrl ? (
          <video
            ref={videoRef}
            key={activeLesson.id}
            src={resolveMediaUrl(activeLesson.videoUrl)}
            controls
            preload="metadata"
            onTimeUpdate={(e) => onTimeUpdate?.(e.currentTarget.currentTime)}
            onLoadedMetadata={(e) => onLoadedMetadata?.(e.currentTarget.duration)}
            onPlay={() => onPlay?.()}
            onEnded={() => onEnded?.()}
            // عمداً بلا aspect-ratio هنا: على عنصر <video> فإن قيمة aspect-ratio
            // الصريحة (غير auto) تَغلب على النسبة الحقيقية للفيديو بدل أن تكون
            // احتياطاً قبل معرفتها فقط — جُرّب هذا فعلياً مع فيديو عمودي حقيقي
            // (360×640) وأعاد فرض صندوق 16:9 عليه، أي أعاد نفس مشكلة الأشرطة
            // السوداء. الحجم يُترك بالكامل لأبعاد الفيديو الحقيقية.
            className="max-h-[40vh] max-w-full rounded-lg bg-slate-900 shadow-md sm:max-h-[46vh] lg:max-h-[52vh]"
          />
        ) : (
          <div className="flex aspect-video max-h-full w-full flex-col items-center justify-center gap-3 rounded-lg bg-slate-900 text-white shadow-md">
            <div className="grid size-14 place-items-center rounded-full bg-white/10">
              <Video className="size-7 text-white/60" />
            </div>
            <strong className="text-lg font-bold">لم يتم رفع فيديو لهذا الدرس بعد</strong>
            <p className="text-sm text-slate-400">{activeLesson.title}</p>
          </div>
        )}
      </section>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-xl font-black text-foreground sm:text-2xl">{activeLesson.title}</h1>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
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

        {/* تنقّل بين الدروس — في RTL: "السابق" يشير يميناً و"التالي" يساراً */}
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!prevLessonId}
            onClick={() => prevLessonId && onNavigateLesson?.(prevLessonId)}
          >
            <ArrowRight className="size-4" /> الدرس السابق
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!nextLessonId}
            onClick={() => nextLessonId && onNavigateLesson?.(nextLessonId)}
          >
            الدرس التالي <ArrowLeft className="size-4" />
          </Button>
        </div>
      </div>

      {showDetails && (
        <Card className="flex flex-col">
          <div className="flex items-center justify-between rounded-t-lg border-b border-border bg-surface-raised px-5 py-3.5">
            <div className="flex items-center gap-1">
              <DetailsTab active={detailsTab === 'about'} onClick={() => setDetailsTab('about')} icon={BookText}>
                نبذة عن الدرس
              </DetailsTab>
              <DetailsTab active={detailsTab === 'transcript'} onClick={() => setDetailsTab('transcript')} icon={AlignLeft}>
                تفريغ الفيديو
              </DetailsTab>
            </div>
            <button
              type="button"
              onClick={onToggleDetails}
              title="إخفاء لوحة التفاصيل"
              className="flex items-center gap-1 text-sm font-bold text-muted-foreground hover:text-foreground"
            >
              طوي <ChevronUp className="size-3.5" />
            </button>
          </div>

          <div className="flex flex-col p-5 sm:p-6">
            {detailsTab === 'about' ? (
              <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">
                {activeLesson.description || 'لا يوجد وصف تفصيلي متوفر لهذا الدرس.'}
              </p>
            ) : (
              <LessonTranscriptPanel {...transcript} />
            )}
          </div>
        </Card>
      )}
    </main>
  );
}

function DetailsTab({ active, onClick, icon: Icon, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-bold transition-colors',
        active ? 'bg-primary-soft text-primary' : 'text-muted-foreground hover:bg-surface hover:text-foreground'
      )}
    >
      <Icon className="size-4" /> {children}
    </button>
  );
}
