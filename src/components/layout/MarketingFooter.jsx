import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api from '../../services/api';
import { normalizeCategory } from '../../utils/constants';

/**
 * Four-column footer following Aduca's layout. The template's app-store
 * column is replaced with a call to action, and its social row is omitted —
 * NGLP has no accounts to link, and href="#" placeholders are the same kind
 * of empty promise the rest of this UI was cleaned of.
 */
function FooterHeading({ children }) {
  return (
    <>
      <h3 className="pb-2 text-xl font-semibold text-foreground">{children}</h3>
      <div className="mb-6 h-px w-[50px] bg-primary" />
    </>
  );
}

export default function MarketingFooter() {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    let isMounted = true;
    api
      .get('/categories/root')
      .then((res) => {
        if (isMounted) setCategories(res.data.map((c) => normalizeCategory(c)).slice(0, 6));
      })
      .catch((err) => {
        console.warn('Failed to load categories for the footer.', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const linkClass = 'block text-muted-foreground transition-colors duration-200 hover:text-primary';

  return (
    <footer className="bg-surface pt-24">
      <div className="mx-auto grid w-[min(1200px,calc(100%-48px))] grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link to="/" className="mb-5 flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-md bg-brand text-xl font-extrabold text-white">N</span>
            <span className="text-2xl font-extrabold tracking-tight text-foreground">NGLP</span>
          </Link>
          <p className="leading-relaxed text-muted-foreground">
            منصة تعلّم بالفيديو، كل درس فيها مرتبط بمساعد ذكي يجيب على أسئلتك في سياق الدرس، واختبار قصير يتأكد أن الفكرة
            وصلت قبل الانتقال للدرس التالي.
          </p>
        </div>

        <div>
          <FooterHeading>روابط سريعة</FooterHeading>
          <ul className="flex flex-col gap-2.5">
            <li><Link to="/catalog" className={linkClass}>دليل الكورسات</Link></li>
            <li><Link to="/dashboard" className={linkClass}>لوحة التعلم</Link></li>
            <li><Link to="/profile" className={linkClass}>الملف الشخصي</Link></li>
            <li><Link to="/login" className={linkClass}>تسجيل الدخول</Link></li>
          </ul>
        </div>

        <div>
          <FooterHeading>التصنيفات</FooterHeading>
          {categories.length === 0 ? (
            <p className="text-muted-foreground">لا توجد تصنيفات متاحة حالياً.</p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {categories.map((category) => (
                <li key={category.id}>
                  <Link to={`/catalog?category=${category.id}`} className={linkClass}>
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <FooterHeading>ابدأ الآن</FooterHeading>
          <p className="mb-5 leading-relaxed text-muted-foreground">
            أنشئ حسابك وابدأ أول كورس اليوم — الوصول للمحتوى مجاني بالكامل.
          </p>
          <Link
            to="/register"
            className="group inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-[15px] font-semibold text-primary-foreground transition-colors duration-200 hover:bg-primary-hover"
          >
            أنشئ حسابك
            <ArrowLeft className="size-4 transition-transform duration-200 group-hover:-translate-x-1" />
          </Link>
        </div>
      </div>

      <div className="mt-16 h-px w-full bg-border" />

      <div className="mx-auto flex w-[min(1200px,calc(100%-48px))] flex-wrap items-center justify-between gap-3 py-6">
        <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} NGLP. جميع الحقوق محفوظة.</p>
        <p className="text-sm text-muted-foreground">منصة تعليمية — مشروع تخرج</p>
      </div>
    </footer>
  );
}
