import { cn } from '@/lib/utils';

export default function PageHeader({ eyebrow, title, actions, className }) {
  return (
    <div className={cn('mb-8 flex items-end justify-between gap-6 border-b border-border pb-5', className)}>
      <div>
        {eyebrow && (
          <p className="mb-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-primary">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-3xl font-semibold leading-tight text-foreground">{title}</h1>
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}
