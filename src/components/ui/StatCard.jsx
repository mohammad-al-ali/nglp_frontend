import { Card } from '@/components/ui/card';

export default function StatCard({ label, value }) {
  return (
    <Card className="flex min-h-28 flex-col justify-center gap-1.5 p-6">
      <span className="text-sm font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      <strong className="font-display text-4xl font-semibold leading-tight text-foreground">{value}</strong>
    </Card>
  );
}
