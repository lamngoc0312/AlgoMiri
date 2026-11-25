import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors cursor-pointer disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#397BDB]',
  {
    variants: {
      variant: {
        primary:
          'bg-[#2B6CC9] text-white hover:bg-[#2B64B8] shadow-xs',
        secondary:
          'bg-[#EAF2FD] text-[#2257A8] hover:bg-[#DCEBFC]',
        outline:
          'border border-[#D7E0EC] bg-white text-[#202B3B] hover:border-[#C2DAFA] hover:bg-[#F7F9FC]',
        ghost:
          'bg-transparent text-[#526075] hover:bg-[#EAF2FD]/70 hover:text-[#202B3B]',
        mint:
          'bg-[#0F8477] text-white hover:bg-[#0E8779] shadow-xs',
        coral:
          'bg-[#F47768] text-white hover:bg-[#DF5E4F] shadow-xs',
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
