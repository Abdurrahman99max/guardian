import type { TextareaHTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'rounded-control border-border-soft bg-surface text-text-primary placeholder:text-text-secondary duration-fast focus:border-guardian-blue min-h-28 w-full resize-y border px-3 py-2.5 text-sm transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
