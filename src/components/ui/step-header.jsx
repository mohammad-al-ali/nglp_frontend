/**
 * Numbered/icon circle + title, used to introduce a form section.
 * Pass exactly one of `step` (sequence number) or `icon` (lucide ref).
 */
export default function StepHeader({ step, icon: Icon, title }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-primary">
        {Icon ? <Icon className="size-3.5" /> : step}
      </span>
      <h2 className="font-display text-lg font-semibold text-foreground">{title}</h2>
    </div>
  );
}
