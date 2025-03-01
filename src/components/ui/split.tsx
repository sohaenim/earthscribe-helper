import * as React from 'react';
import { cn } from '@/lib/utils';

interface SplitProps extends React.HTMLAttributes<HTMLDivElement> {}

const Split = React.forwardRef<HTMLDivElement, SplitProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex gap-4 overflow-hidden', className)}
        {...props}
      />
    );
  }
);
Split.displayName = 'Split';

export { Split };
