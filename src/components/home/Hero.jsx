import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bot, FileQuestion, Video } from 'lucide-react';
import heroBg from '../../assets/hero-bg.jpg';

const FEATURES = [
  { icon: Bot, title: 'مساعد ذكي في كل درس', desc: 'اسأل عن أي نقطة واحصل على شرح في سياق الدرس' },
  { icon: FileQuestion, title: 'اختبارات قصيرة', desc: 'تأكد أن الفكرة وصلت قبل الانتقال للدرس التالي' },
  { icon: Video, title: 'دروس فيديو مع تفريغ نصي', desc: 'تابع الشرح واقرأ النص المفرّغ في نفس الوقت' },
];

/**
 * Aduca's hero: a photograph under a navy scrim, left-aligned copy with a
 * rotating word, a search field, and a coral gradient feature strip that
 * hangs below and overlaps the following section.
 */
export default function Hero({ categories = [] }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [wordIndex, setWordIndex] = useState(0);

  // The rotating word cycles real category names rather than invented ones.
  const words = categories.length > 0 ? categories.map((c) => c.name) : ['البرمجة'];

  useEffect(() => {
    if (words.length < 2) return;
    const timer = setInterval(() => setWordIndex((i) => (i + 1) % words.length), 2200);
    return () => clearInterval(timer);
  }, [words.length]);

  function handleSearch(event) {
    event.preventDefault();
    const term = query.trim();
    navigate(term ? `/catalog?q=${encodeURIComponent(term)}` : '/catalog');
  }

  return (
    <section className="relative">
      <div className="relative bg-cover bg-center pt-32" style={{ backgroundImage: `url(${heroBg})` }}>
        <div className="absolute inset-0 bg-brand/85" />

        <div className="relative mx-auto w-[min(1200px,calc(100%-48px))]">
          <h1 className="pb-4 text-4xl font-bold leading-tight text-white lg:text-[55px] lg:leading-[60px]">
            ابدأ رحلتك في{' '}
            <span key={wordIndex} className="inline-block animate-in fade-in zoom-in-95 duration-500 text-white">
              {words[wordIndex]}
            </span>
          </h1>
          <p className="max-w-2xl pb-6 text-lg leading-8 text-white/80">
            دروس فيديو مدعومة بمساعد ذكي يجيب على أسئلتك لحظياً، واختبارات قصيرة تقيس فهمك بعد كل درس.
          </p>

          <form onSubmit={handleSearch} className="relative w-full pt-2 lg:w-1/2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ما الذي تريد تعلمه؟"
              className="h-[50px] w-full rounded-md border border-transparent bg-surface ps-4 pe-12 text-sm text-foreground outline-none transition-colors duration-200 focus:border-primary"
            />
            <button
              type="submit"
              aria-label="بحث"
              className="absolute end-3 top-1/2 -translate-y-1/2 text-foreground transition-colors duration-200 hover:text-primary"
            >
              <Search className="size-[18px]" />
            </button>
          </form>
        </div>

        {/* Coral feature strip — sits below the copy and bleeds into the next section */}
        <div className="relative mt-32 bg-gradient-to-bl from-primary to-[#f58585]">
          <div className="mx-auto grid w-[min(1200px,calc(100%-48px))] grid-cols-1 gap-6 py-6 md:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-center gap-4 py-2">
                <span className="flex size-[60px] shrink-0 items-center justify-center rounded-full bg-surface shadow-icon">
                  <Icon className="size-7 text-primary" />
                </span>
                <div>
                  <h4 className="text-xl font-bold text-white">{title}</h4>
                  <p className="text-white/85">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
