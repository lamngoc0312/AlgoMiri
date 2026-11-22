import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors cursor-pointer disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#645BE8]',
  {
    variants: {
      variant: {
        primary:
          'bg-[#645BE8] text-white hover:bg-[#4F46D8] shadow-xs',
        secondary:
          'bg-[#EEF0FF] text-[#4F46D8] hover:bg-[#E1E4FF]',
        outline:
          'border border-[#D7DCEB] bg-white text-[#20253B] hover:bg-[#F7F8FC]',
        ghost:
          'bg-transparent text-[#555D7A] hover:bg-[#EEF0FF]/70 hover:text-[#20253B]',
        mint:
          'bg-[#16B89D] text-white hover:bg-[#0E967F] shadow-xs',
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
