import { cn } from '@/lib/utils';

/**
 * Page-level width, centering, and padding — nothing else. Split out
 * of the old PageFrame so a header-less shell (or a shell with a
 * differently-shaped header) is expressible, which the monolithic
 * version couldn't do.
 */
export default function PageShell({ className, children }) {
  return (
    <section className={cn('mx-auto w-[min(1240px,calc(100%-48px))] py-12 pb-18 font-sans', className)}>
      {children}
    </section>
  );
}
