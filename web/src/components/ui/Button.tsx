import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors cursor-pointer disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-blue)]',
  {
    variants: {
      variant: {
        primary:
          'bg-[var(--accent-blue-solid)] text-white hover:bg-[var(--accent-blue-hover)] shadow-xs',
        secondary:
          'bg-[var(--accent-blue-soft)] text-[var(--accent-blue-text)] hover:bg-[var(--accent-blue-soft-hover)]',
        outline:
          'border border-[var(--border-control)] bg-[var(--surface-card)] text-[var(--text-primary)] hover:border-[var(--accent-blue-border)] hover:bg-[var(--surface-elevated)]',
        ghost:
          'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)] hover:text-[var(--text-primary)]',
        mint:
          'bg-[var(--accent-teal-solid)] text-white hover:bg-[var(--accent-teal-hover)] shadow-xs',
        coral:
          'bg-[var(--accent-coral-solid)] text-white hover:bg-[var(--accent-coral-hover)] shadow-xs',
      },
      size: {
        sm: 'h-9 px-3.5 text-sm',
        md: 'h-11 px-5 text-sm',
        lg: 'h-12 px-6 text-base',
        icon: 'h-9 w-9 p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({
  className,
  variant,
  size,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
