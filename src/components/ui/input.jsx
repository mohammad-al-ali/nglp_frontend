import * as React from 'react';
import { cn } from '@/lib/utils';

const Input = React.forwardRef(({ className, type = 'text', ...props }, ref) => {
  return (
    <input
      type={type}
      ref={ref}
      className={cn(
        'flex h-11 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground outline-none transition-all duration-200 ease-in-out placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50',
        'focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary-soft',
        'aria-[invalid=true]:border-error aria-[invalid=true]:focus-visible:ring-error-soft',
        className
      )}
      {...props}
    />
  );
});
Input.displayName = 'Input';

export { Input };
