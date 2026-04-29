import { cn } from '@repe/ui';
import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  variant?: 'neutral' | 'subtle' | 'accent' | 'success' | 'warn' | 'danger';
  size?: 'sm' | 'md';
  className?: string;
};

const VARIANT = {
  neutral: 'bg-bg-subtle text-text-secondary border-border',
  subtle: 'bg-bg-subtle text-text-primary border-border',
  accent: 'bg-accent/15 text-accent border-accent/20',
  success: 'bg-success/15 text-success border-success/20',
  warn: 'bg-warn/15 text-warn border-warn/20',
  danger: 'bg-danger/15 text-danger border-danger/20',
} as const;

const SIZE = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-1 text-xs',
} as const;

export function Chip({
  children,
  variant = 'neutral',
  size = 'md',
  className,
}: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-pill border font-medium uppercase tracking-wide',
        VARIANT[variant],
        SIZE[size],
        className,
      )}
    >
      {children}
    </span>
  );
}
