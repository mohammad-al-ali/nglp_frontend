import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import ImagePicker from '@/components/ui/ImagePicker';

const STATUS = {
  pending: { label: 'جاهز للرفع', variant: 'warning' },
  uploading: { label: 'جاري الرفع...', variant: 'default' },
  completed: { label: 'اكتمل الرفع', variant: 'success' },
  error: { label: 'فشل الرفع', variant: 'destructive' },
};

export default function UploadQueueItem({ item, onImageChange }) {
  const status = STATUS[item.status] ?? STATUS.pending;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-0.5">
          <strong className="truncate text-sm font-semibold text-foreground">{item.title}</strong>
          <span className="truncate font-mono text-xs text-muted-foreground">{item.fileName}</span>
        </div>
        <Badge variant={status.variant} className="shrink-0">
          {status.label}
        </Badge>
      </div>

      {item.status === 'pending' && onImageChange && (
        <ImagePicker label="صورة مصغرة للدرس (اختياري)" onChange={(file) => onImageChange(item.id, file)} />
      )}

      {item.status === 'uploading' && <Progress value={item.progress} />}
    </div>
  );
}
