import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

const badgeVariants = cva('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium', {
  variants: {
    variant: {
      default: 'bg-guardian-blue/10 text-guardian-blue',
      success: 'bg-success/10 text-success',
      warning: 'bg-warning/15 text-warning',
      risk: 'bg-risk/10 text-risk',
      learning: 'bg-learning/15 text-text-secondary',
    },
  },
  defaultVariants: { variant: 'default' },
});

type BadgeProps = HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>;

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />;
}

export { Badge, badgeVariants };
