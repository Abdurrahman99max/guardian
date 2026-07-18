import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
};

function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <section
      className={cn(
        'rounded-card border-border-soft bg-surface flex flex-col items-start gap-3 border border-dashed p-6',
        className,
      )}
    >
      <div className="bg-learning size-2 rounded-full" />
      <div className="space-y-1">
        <h2 className="text-text-primary text-base font-semibold">{title}</h2>
        <p className="text-text-secondary text-sm leading-6">{description}</p>
      </div>
      {action}
    </section>
  );
}

export { EmptyState };
