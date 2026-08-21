import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const TONES = {
  primary: 'bg-primary-soft text-primary',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  neutral: 'bg-surface-raised text-muted-foreground',
};

export default function StatCard({ label, value, icon: Icon, tone = 'neutral' }) {
  if (!Icon) {
    return (
      <Card className="flex min-h-28 flex-col justify-center gap-1.5 p-6">
        <span className="text-sm font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
        <strong className="font-display text-4xl font-semibold leading-tight text-foreground">{value}</strong>
      </Card>
    );
  }

  return (
    <Card className="flex min-h-28 items-center gap-4 p-6">
      <div className={cn('flex size-12 shrink-0 items-center justify-center rounded-md', TONES[tone])}>
        <Icon className="size-6" />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
        <strong className="font-display text-4xl font-semibold leading-tight text-foreground">{value}</strong>
      </div>
    </Card>
  );
}
