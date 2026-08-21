import { Link } from 'react-router-dom';
import { ArrowLeft, Check, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

const steps = [
  { label: 'المفهوم الأساسي', state: 'done' },
  { label: 'أمثلة تطبيقية', state: 'done' },
  { label: 'أسئلة المساعد الذكي', state: 'active' },
  { label: 'اختبار قصير', state: 'upcoming' },
];

export default function Hero() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-16 px-6 py-20 lg:grid-cols-2 lg:py-28">
        {/* Copy column */}
        <div>
          <p className="mb-4 font-mono text-xs font-medium uppercase tracking-wider text-primary">
            منصة تعلّم بالفيديو مدعومة بالذكاء الاصطناعي
          </p>
          <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">
            شاهد الدرس، اسأل، ثم تأكد أنك فهمت
          </h1>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground">
            كل درس مرئي مرتبط بمساعد ذكي يجيب على أسئلتك في سياق الدرس نفسه، واختبار
            قصير في النهاية يتأكد أن الفكرة وصلت قبل الانتقال للدرس التالي.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button as={Link} to="/catalog">
              استكشف الكورسات
              <ArrowLeft className="size-4" />
            </Button>
            <Button as={Link} to="/dashboard" variant="outline">
              الذهاب إلى لوحة التعلم
            </Button>
          </div>
        </div>

        {/* Signature: study room mockup */}
        <div className="rounded-lg border border-border bg-surface shadow-soft-lg">
          <div className="flex items-center gap-1.5 border-b border-border px-4 py-3">
            <span className="size-2 rounded-full bg-border-hover" />
            <span className="size-2 rounded-full bg-border-hover" />
            <span className="size-2 rounded-full bg-border-hover" />
            <span className="ms-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
              غرفة الدراسة
            </span>
          </div>

          <div className="grid grid-cols-[minmax(0,7rem)_1fr] gap-0">
            <ol className="flex flex-col gap-1 border-e border-border p-3">
              {steps.map((step, i) => (
                <li
                  key={step.label}
                  className={`flex items-start gap-2 rounded-md p-2 text-xs ${
                    step.state === 'active' ? 'bg-primary-soft text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {step.state === 'done' ? (
                    <Check className="mt-0.5 size-3 shrink-0 text-primary" />
                  ) : (
                    <span className="mt-0.5 font-mono text-xs shrink-0">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  )}
                  <span className={step.state === 'upcoming' ? 'opacity-60' : ''}>{step.label}</span>
                </li>
              ))}
            </ol>

            <div className="flex flex-col gap-3 p-4">
              <div className="flex aspect-video items-center justify-center rounded-md border border-border bg-surface-raised">
                <span className="flex size-9 items-center justify-center rounded-full border border-border-hover">
                  <Play className="size-3.5 fill-muted-foreground text-muted-foreground" />
                </span>
              </div>

              <div className="flex flex-col gap-2">
                <div className="max-w-[85%] rounded-md border-s-2 border-primary bg-primary-soft px-3 py-2 text-xs leading-relaxed text-foreground">
                  الفكرة الأساسية هي أن الحالة (state) تتحكم بما يظهر على الشاشة.
                </div>
                <div className="max-w-[75%] self-end rounded-md bg-surface-raised px-3 py-2 text-xs leading-relaxed text-foreground">
                  ما الفرق بينها وبين props؟
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
