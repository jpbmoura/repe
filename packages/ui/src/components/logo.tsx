import type { ImgHTMLAttributes } from 'react';
import { cn } from '../lib/cn.js';

type LogoVariant = 'dark' | 'light' | 'mono-dark' | 'mono-light';

type LogoProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'> & {
  variant?: LogoVariant;
};

export function Logo({ variant = 'dark', className, ...props }: LogoProps) {
  return (
    <img
      src={`/logos/repe-wordmark-${variant}.svg`}
      alt="Repê"
      className={cn('h-10 w-auto select-none', className)}
      draggable={false}
      {...props}
    />
  );
}
