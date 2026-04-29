import { corDoNome, iniciais } from '@/lib/avatar';
import { cn } from '@repe/ui';

type Props = {
  nome: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'colorful' | 'neutral';
  active?: boolean;
  className?: string;
};

const SIZES = {
  sm: 'h-9 w-9 text-xs',
  md: 'h-11 w-11 text-sm',
  lg: 'h-12 w-12 text-base',
} as const;

export function Avatar({
  nome,
  size = 'md',
  variant = 'colorful',
  active = false,
  className,
}: Props) {
  const init = iniciais(nome);

  if (variant === 'neutral') {
    return (
      <div
        className={cn(
          'inline-flex shrink-0 items-center justify-center rounded-full bg-bg-subtle font-num font-semibold text-text-secondary',
          SIZES[size],
          active && 'ring-accent ring-2',
          className,
        )}
        aria-hidden
      >
        {init}
      </div>
    );
  }

  const cor = corDoNome(nome);
  return (
    <div
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-num font-semibold',
        SIZES[size],
        active && 'ring-accent ring-2',
        className,
      )}
      style={{ backgroundColor: cor.bg, color: cor.text }}
      aria-hidden
    >
      {init}
    </div>
  );
}
