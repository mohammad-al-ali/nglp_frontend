import { Link } from 'react-router-dom';
import { FileText, AlignLeft, Sparkles, ChevronUp, Video } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { resolveMediaUrl } from '../../../utils/constants';

export default function LessonVideoPane({ activeLesson, videoRef, showDetails, onToggleDetails, courseId, lessonId, onSmartPrompt }) {
  return (
    <main className="flex min-w-0 flex-1 flex-col gap-5 overflow-y-auto p-6">
      {/*
       * لا نفرض صندوقاً بنسبة 16:9 ثابتة هنا: أي فيديو بنسبة أبعاد مختلفة
       * (عمودي، 4:3، ...) كان يُعرض بحجمه الحقيقي داخل هذا الصندوق الثابت عبر
       * object-contain، تاركاً شريطين أسودين فارغين على الجانبين. بترك القسم
       * كحاوية توسيط فقط، وتحديد أقصى ارتفاع/عرض على الفيديو نفسه دون فرض عرض
       * أو ارتفاع صريح، يحسب المتصفح حجم المشغل تلقائياً بنفس نسبة أبعاد الفيديو
       * الأصلية، فلا تظهر أي حواف فارغة حول الفيديو.
       *
       * shrink-0 ضروري: هذا القسم عنصر flex ضمن <main> عمودي. بدون shrink-0،
       * إن لم تتسع مساحة <main> المتاحة لكل أبنائه (الفيديو + شريط العنوان +
       * بطاقة التفاصيل)، يقلّص Flexbox ارتفاع هذا القسم دون علمه بأن الفيديو
       * بداخله له ارتفاعه الخاص (مقيّد بـ max-h-[52vh] المستقلة) — فيتجاوز
       * الفيديو حدود حاويته المقلَّصة، ويقصّه overflow-hidden من الأعلى
       * والأسفل. تعطيل الانكماش يجعل الحاوية تحافظ على ارتفاعها المحسوب
       * دائماً، ويترك overflow-y-auto في <main> يتولى التمرير بدل ذلك.
       */}
      <section className="relative flex h-[52vh] w-full shrink-0 items-center justify-center overflow-hidden">
        {activeLesson.videoUrl ? (
          <video
            ref={videoRef}
            key={activeLesson.id}
            src={resolveMediaUrl(activeLesson.videoUrl)}
            controls
            preload="metadata"
            // عمداً بلا aspect-ratio هنا: على عنصر <video> فإن قيمة aspect-ratio
            // الصريحة (غير auto) تَغلب على النسبة الحقيقية للفيديو بدل أن تكون
            // احتياطاً قبل معرفتها فقط — جُرّب هذا فعلياً مع فيديو عمودي حقيقي
            // (360×640) وأعاد فرض صندوق 16:9 عليه، أي أعاد نفس مشكلة الأشرطة
            // السوداء. الحجم يُترك بالكامل لأبعاد الفيديو الحقيقية.
            className="max-h-[52vh] max-w-full rounded-lg bg-slate-900 shadow-md"
          />
        ) : (
          <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-lg bg-slate-900 text-white shadow-md">
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
