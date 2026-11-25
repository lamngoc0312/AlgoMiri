import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-tight',
  {
    variants: {
      variant: {
        blue: 'bg-[#EAF2FD] text-[#2257A8] border border-[#C2DAFA]',
        // Legacy alias mapped to Primary Blue so zero purple remains
        indigo: 'bg-[#EAF2FD] text-[#2257A8] border border-[#C2DAFA]',
        teal: 'bg-[#E6F7F5] text-[#0D7A6E] border border-[#B4E6DF]',
        mint: 'bg-[#E6F7F5] text-[#0D7A6E] border border-[#B4E6DF]',
        green: 'bg-[#EEF8F1] text-[#256B3A] border border-[#C2E5CC]',
        sky: 'bg-[#EDF8FE] text-[#1B648D] border border-[#C5E7FA]',
        coral: 'bg-[#FEF0EE] text-[#B8382A] border border-[#FACAC4]',
        amber: 'bg-[#FEF7E7] text-[#925E08] border border-[#F8DFA8]',
        neutral: 'bg-[#F1F5FA] text-[#526075] border border-[#DCE4EE]',
        demo: 'bg-[#FEF7E7] text-[#925E08] border border-[#F2B84B]',
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
