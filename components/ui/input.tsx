import type { InputHTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

function Input({ className, type = 'text', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'rounded-control border-border-soft bg-surface text-text-primary placeholder:text-text-secondary duration-fast focus:border-guardian-blue h-11 w-full border px-3 text-sm transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      type={type}
      {...props}
    />
  );
}

export { Input };
