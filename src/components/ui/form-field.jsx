import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

/**
 * TextField's successor: a layout wrapper, not a type-switch component.
 * Compose it with whatever control it needs — <Input>, <Textarea>,
 * <Select> — instead of a single component owning every input type.
 */
export default function FormField({ label, hint, error, htmlFor, className, children }) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && <Label htmlFor={htmlFor}>{label}</Label>}
      {children}
      {error ? (
        <p className="text-xs text-error">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
