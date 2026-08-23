import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import SectionHeading from './SectionHeading';

/**
 * The two static marketing bands from home-2 — "Aduca's Guides" (elevated
 * cards on a gray band) and "Why Aduca works" (the same content, deliberately
 * stripped of its card shell). One component, a `variant` prop, matching how
 * the template itself reuses `.card-item` for both.
 */
export default function FeatureBand({ title, desc, items, variant = 'card', gray = false, cta }) {
  return (
    <section className={cn('py-28', gray && 'bg-surface-raised')}>
      <div className="mx-auto w-[min(1200px,calc(100%-48px))] text-center">
        <SectionHeading title={title} desc={desc} />

        <div
          className={cn(
            'grid grid-cols-1 gap-[30px] pt-12 sm:grid-cols-2',
            items.length === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4'
          )}
        >
          {items.map(({ icon: Icon, title: itemTitle, desc: itemDesc }) => (
            <div
              key={itemTitle}
              className={cn(
                'flex flex-col items-center text-center transition-transform duration-200 ease-in-out',
                variant === 'card' && 'rounded-lg bg-surface p-8 shadow-soft hover:-translate-y-1'
              )}
            >
              <span className="flex size-[70px] items-center justify-center rounded-full bg-primary-soft text-primary">
                <Icon className="size-8" />
              </span>
              <h5 className="pb-2 pt-4 text-lg font-semibold text-foreground">{itemTitle}</h5>
              <p className="text-muted-foreground">{itemDesc}</p>
            </div>
          ))}
        </div>

        {cta && (
          <div className="flex flex-wrap items-center justify-center gap-8 pt-10">
            {cta.map(({ label, question, to, icon: Icon }) => (
              <div key={label}>
                <p className="pb-2 text-muted-foreground">{question}</p>
                <Link
                  to={to}
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-1.5 text-sm font-semibold text-primary-foreground transition-colors duration-200 hover:bg-primary-hover"
                >
                  <Icon className="size-4" />
                  {label}
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
