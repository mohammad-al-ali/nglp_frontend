import * as React from 'react';
import { cn } from '@/lib/utils';

const Textarea = React.forwardRef(({ className, rows = 4, ...props }, ref) => {
  return (
    <textarea
      rows={rows}
      ref={ref}
      className={cn(
        'flex w-full resize-y rounded-md border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none transition-all duration-200 ease-in-out placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50',
        'focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary-soft',
        'aria-[invalid=true]:border-error aria-[invalid=true]:focus-visible:ring-error-soft',
        className
      )}
      {...props}
    />
  );
});
Textarea.displayName = 'Textarea';

export { Textarea };
