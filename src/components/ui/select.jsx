import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Styled native <select> — deliberately not Radix Select. The app has
 * four desktop-only dropdowns; a portal-based popover with its own RTL
 * handling is not worth the dependency for that.
 */
const Select = React.forwardRef(({ className, children, ...props }, ref) => {
  return (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          'h-11 w-full appearance-none rounded-md border border-border bg-surface ps-3 pe-9 text-sm text-foreground outline-none transition-all duration-200 ease-in-out disabled:cursor-not-allowed disabled:opacity-50',
          'focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary-soft',
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
});
Select.displayName = 'Select';

export { Select };
