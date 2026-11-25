import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-tight',
  {
    variants: {
      variant: {
        blue: 'bg-[var(--accent-blue-soft)] text-[var(--accent-blue-text)] border border-[var(--accent-blue-border)]',
        indigo: 'bg-[var(--accent-blue-soft)] text-[var(--accent-blue-text)] border border-[var(--accent-blue-border)]',
        teal: 'bg-[var(--accent-teal-soft)] text-[var(--accent-teal-text)] border border-[var(--accent-teal-border)]',
        mint: 'bg-[var(--accent-teal-soft)] text-[var(--accent-teal-text)] border border-[var(--accent-teal-border)]',
        green: 'bg-[var(--accent-green-soft)] text-[var(--accent-green-text)] border border-[var(--accent-green-border)]',
        sky: 'bg-[var(--accent-sky-soft)] text-[var(--accent-sky-text)] border border-[var(--accent-sky-border)]',
        coral: 'bg-[var(--accent-coral-soft)] text-[var(--accent-coral-text)] border border-[var(--accent-coral-border)]',
        amber: 'bg-[var(--accent-amber-soft)] text-[var(--accent-amber-text)] border border-[var(--accent-amber-border)]',
        neutral: 'bg-[var(--surface-elevated)] text-[var(--text-secondary)] border border-[var(--border-subtle)]',
        demo: 'bg-[var(--accent-amber-soft)] text-[var(--accent-amber-text)] border border-[var(--accent-amber)]',
      },
    },
    defaultVariants: {
      variant: 'neutral',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
