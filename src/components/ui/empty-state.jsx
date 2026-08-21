import { cn } from '@/lib/utils';

/**
 * Consistent "nothing here" state — replaces 13 duplicated copies that
 * previously used three different glyph systems (emoji, lucide, none).
 * `icon` is a lucide-react component reference, e.g. `icon={BookOpen}`.
 */
export default function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={cn('flex flex-col items-center gap-3 rounded-lg border border-dashed border-border px-6 py-12 text-center', className)}>
      {Icon && (
        <div className="flex size-11 items-center justify-center rounded-full bg-surface-raised">
          <Icon className="size-5 text-muted-foreground" />
        </div>
      )}
      <div className="flex flex-col gap-1">
        <h3 className="font-display text-base font-semibold text-foreground">{title}</h3>
        {description && <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}
