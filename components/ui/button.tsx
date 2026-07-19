import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ButtonHTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-control font-medium whitespace-nowrap transition-[background-color,color,box-shadow,transform] duration-fast ease-standard focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 active:translate-y-px',
  {
    variants: {
      variant: {
        primary:
          'bg-guardian-blue text-surface shadow-none hover:bg-guardian-blue/90 hover:shadow-card',
        secondary: 'bg-surface text-text-primary shadow-card hover:bg-foundation',
        outline: 'border border-border-soft/70 bg-transparent text-text-primary hover:bg-surface',
        ghost: 'text-text-secondary hover:bg-surface/80 hover:text-text-primary',
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        default: 'h-10 px-3.5 text-sm',
        lg: 'h-11 px-4 text-base',
        icon: 'size-10',
      },
    },
    defaultVariants: { variant: 'primary', size: 'default' },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : 'button';
  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
