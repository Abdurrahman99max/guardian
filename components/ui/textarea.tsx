import type { TextareaHTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'rounded-writing border-border-soft/60 bg-surface text-text-primary placeholder:text-text-secondary duration-fast focus:border-guardian-blue min-h-28 w-full resize-y border px-4 py-3 text-[15px] leading-7 transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
