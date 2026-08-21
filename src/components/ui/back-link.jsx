import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * The one "go back" affordance for the whole app. Arrow direction was
 * inconsistent across pages — a left-pointing emoji (wrong: in this
 * RTL app, "back" reads toward the right, where the reading flow
 * starts), a bare "→" text glyph, and lucide ArrowRight all appeared
 * for the same action. Standardizes on ArrowRight.
 */
export default function BackLink({ to, children, className }) {
  return (
    <Link
      to={to}
      className={cn(
        'inline-flex h-10 items-center gap-2 rounded-md border border-border bg-surface px-4 text-sm font-medium text-foreground outline-none transition-all duration-200 ease-in-out hover:bg-surface-raised focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        className
      )}
    >
      <ArrowRight className="size-4" />
      {children}
    </Link>
  );
}
