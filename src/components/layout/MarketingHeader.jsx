import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Search, ChevronDown, LogIn, UserPlus } from 'lucide-react';
import api, { getStoredUser } from '../../services/api';
import { normalizeCategory } from '../../utils/constants';
import { isAdmin, isTeacher } from '@/lib/roles';
import { resolveMediaUrl } from '../../utils/constants';
import { cn } from '@/lib/utils';

/**
 * Top navigation for the public marketing page, following Aduca's two-tier
 * header. The template's cart, phone/email bar, and dark-mode toggle have no
 * counterpart here (no commerce, no support line, light-mode-only system), so
 * tier one carries the auth affordances instead.
 */
export default function MarketingHeader() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [categories, setCategories] = useState([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let isMounted = true;
    api
      .get('/categories/root')
      .then((res) => {
        if (isMounted) setCategories(res.data.map((c) => normalizeCategory(c)));
      })
      .catch((err) => {
        // A missing dropdown is not worth surfacing on a marketing page.
        console.warn('Failed to load categories for the header menu.', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  function handleSearch(event) {
    event.preventDefault();
    const term = query.trim();
    navigate(term ? `/catalog?q=${encodeURIComponent(term)}` : '/catalog');
  }

  // Where the single coral call-to-action should land, per role.
  const cta = !user
    ? { to: '/register', label: 'أنشئ حسابك' }
    : isAdmin(user)
      ? { to: '/admin/users', label: 'لوحة المشرف' }
      : isTeacher(user)
        ? { to: '/teacher', label: 'مساحة المعلم' }
        : { to: '/dashboard', label: 'لوحة التعلم' };

  return (
    <header className="sticky top-0 z-50 bg-surface">
      {/* Tier 1 — utility bar */}
      <div className="hidden border-b border-border lg:block">
        <div className="mx-auto flex w-[min(1200px,calc(100%-48px))] items-center justify-end py-1.5 text-sm">
          {user ? (
            <Link to="/profile" className="flex items-center gap-2 text-muted-foreground transition-colors duration-200 hover:text-primary">
              <span className="flex size-6 items-center justify-center overflow-hidden rounded-full border border-primary-border bg-primary-soft text-xs font-bold text-primary">
                {user.avatarUrl ? (
                  <img src={resolveMediaUrl(user.avatarUrl)} alt="" className="size-full object-cover" />
                ) : (
                  user.fullName?.charAt(0) || 'U'
                )}
              </span>
              أهلاً، {user.fullName || 'المستخدم'}
            </Link>
          ) : (
            <ul className="flex items-center">
              <li className="border-e border-border pe-3 me-3">
                <Link to="/login" className="flex items-center gap-1.5 text-muted-foreground transition-colors duration-200 hover:text-primary">
                  <LogIn className="size-4" />
                  تسجيل الدخول
                </Link>
              </li>
              <li>
                <Link to="/register" className="flex items-center gap-1.5 text-muted-foreground transition-colors duration-200 hover:text-primary">
                  <UserPlus className="size-4" />
                  حساب جديد
                </Link>
              </li>
            </ul>
          )}
        </div>
      </div>

      {/* Tier 2 — main menu */}
      <div className="border-b border-border">
        <div className="mx-auto flex w-[min(1200px,calc(100%-48px))] items-center gap-6 py-4">
          <Link to="/" className="flex shrink-0 items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-md bg-brand text-xl font-extrabold text-white">N</span>
            <span className="text-2xl font-extrabold tracking-tight text-foreground">NGLP</span>
          </Link>

          {/* Categories dropdown — CSS hover-driven, matching the template */}
          <div className="group relative hidden lg:block">
            <button
              type="button"
              className="flex items-center gap-1 py-2 text-[15px] text-foreground transition-colors duration-200 group-hover:text-primary"
            >
              التصنيفات
              <ChevronDown className="size-3.5" />
            </button>
            <div className="invisible absolute top-full start-0 z-50 w-56 rounded-lg border border-border bg-surface py-3 opacity-0 shadow-soft transition-all duration-200 group-hover:visible group-hover:opacity-100">
              {categories.length === 0 ? (
                <span className="block px-5 py-1.5 text-sm text-muted-foreground">لا توجد تصنيفات</span>
              ) : (
                categories.map((category) => (
                  <Link
                    key={category.id}
                    to={`/catalog?category=${category.id}`}
                    className="block px-5 py-1.5 text-sm text-muted-foreground transition-colors duration-200 hover:text-primary"
                  >
                    {category.name}
                  </Link>
                ))
              )}
            </div>
          </div>

          <form onSubmit={handleSearch} className="relative hidden min-w-0 flex-1 md:block">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث عن كورس..."
              className="h-[50px] w-full rounded-md border border-border bg-surface ps-4 pe-11 text-sm text-foreground outline-none transition-colors duration-200 focus:border-primary"
            />
            <button
              type="submit"
              aria-label="بحث"
              className="absolute end-3 top-1/2 -translate-y-1/2 text-foreground transition-colors duration-200 hover:text-primary"
            >
              <Search className="size-[18px]" />
            </button>
          </form>

          <nav className="hidden shrink-0 items-center gap-5 lg:flex">
            {[
              { to: '/', label: 'الرئيسية', end: true },
              { to: '/catalog', label: 'الكورسات', end: false },
            ].map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'text-[15px] transition-colors duration-200 hover:text-primary',
                    isActive ? 'text-primary' : 'text-foreground'
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <Link
            to={cta.to}
            className="shrink-0 rounded-md bg-primary px-5 py-2.5 text-[15px] font-semibold text-primary-foreground transition-colors duration-200 hover:bg-primary-hover"
          >
            {cta.label}
          </Link>
        </div>
      </div>
    </header>
  );
}
