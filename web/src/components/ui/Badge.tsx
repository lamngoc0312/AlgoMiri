import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-tight',
  {
    variants: {
      variant: {
        indigo: 'bg-[#EEF0FF] text-[#4F46D8] border border-[#D8DCFF]',
        mint: 'bg-[#E6F8F4] text-[#0D7D6A] border border-[#BDECE2]',
        amber: 'bg-[#FEF6E6] text-[#9A630A] border border-[#F8DFA8]',
        neutral: 'bg-[#F0F2F8] text-[#4A526E] border border-[#DFE3F0]',
        demo: 'bg-[#FEF6E6] text-[#9A630A] border border-[#F1B34C]',
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
