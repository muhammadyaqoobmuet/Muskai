import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'quiet';
type Size = 'sm' | 'md' | 'lg';

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-pill font-medium whitespace-nowrap ' +
  'transition-[background-color,color,border-color,transform,opacity] duration-200 ease-out-expo ' +
  'active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-spark text-white hover:bg-spark-soft',
  secondary: 'border border-ink-100/80 bg-transparent text-ink-100 hover:bg-ink-950',
  ghost: 'text-spark-text hover:underline hover:underline-offset-4',
  quiet: 'bg-ink-950 text-ink-100 hover:bg-ink-800',
  danger: 'text-danger hover:bg-danger-soft',
};

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3.5 text-[13px]',
  md: 'h-10 px-5 text-[15px]',
  lg: 'h-12 px-7 text-[17px]',
};

export function buttonStyles(variant: Variant = 'primary', size: Size = 'md', extra?: string) {
  return `${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${extra ?? ''}`;
}

interface ButtonProps extends ComponentProps<'button'> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

export function Button({ variant, size, className, children, ...rest }: ButtonProps) {
  return (
    <button className={buttonStyles(variant, size, className)} {...rest}>
      {children}
    </button>
  );
}

interface ButtonLinkProps extends ComponentProps<typeof Link> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

export function ButtonLink({ variant, size, className, children, ...rest }: ButtonLinkProps) {
  return (
    <Link className={buttonStyles(variant, size, className)} {...rest}>
      {children}
    </Link>
  );
}

interface IconButtonProps extends ComponentProps<'button'> {
  label: string;
  children: ReactNode;
  size?: Size;
}

export function IconButton({ label, children, size = 'md', className, ...rest }: IconButtonProps) {
  const box = size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-12 w-12' : 'h-10 w-10';
  return (
    <button
      aria-label={label}
      title={label}
      className={`${BASE} ${box} border border-ink-700 bg-white text-ink-300 hover:border-ink-600 hover:bg-ink-950 ${className ?? ''}`}
      {...rest}
    >
      {children}
    </button>
  );
}
