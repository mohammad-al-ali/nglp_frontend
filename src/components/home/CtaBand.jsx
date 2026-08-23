import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

/**
 * Replaces home-2's newsletter form. A form with no backend behind it is
 * exactly the "reports success on failure" pattern the rest of this app was
 * cleaned of, so the same gray band and split keep the template's rhythm
 * while the right half is a real, working call to action instead.
 */
export default function CtaBand() {
  return (
    <section className="bg-surface-raised py-20">
      <div className="mx-auto flex w-[min(1200px,calc(100%-48px))] flex-col items-center justify-between gap-8 lg:flex-row">
        <div className="text-center lg:text-start">
          <h2 className="text-[35px] font-bold text-foreground">جاهز تبدأ؟</h2>
          <p className="pt-1 text-lg leading-8 text-muted-foreground">أنشئ حسابك وابدأ أول درس اليوم، مجاناً بالكامل.</p>
        </div>

        <Link
          to="/register"
          className="group inline-flex shrink-0 items-center gap-2 rounded-md bg-primary px-6 py-3 text-[15px] font-semibold text-primary-foreground transition-colors duration-200 hover:bg-primary-hover"
        >
          أنشئ حسابك الآن
          <ArrowLeft className="size-4 transition-transform duration-200 group-hover:-translate-x-1" />
        </Link>
      </div>
    </section>
  );
}
