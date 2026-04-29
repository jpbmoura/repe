import { cn } from '@repe/ui';

export type StatItem = {
  label: string;
  value: string | number;
  accent?: 'success' | 'warn' | 'danger' | null;
  loading?: boolean;
};

type Props = {
  items: StatItem[];
  className?: string;
};

const ACCENT_CLASS = {
  success: 'text-success',
  warn: 'text-warn',
  danger: 'text-danger',
} as const;

export function Stats({ items, className }: Props) {
  return (
    <div className={cn('grid grid-cols-3 gap-2', className)}>
      {items.map((item) => (
        <div
          key={item.label}
          className="bg-bg-elevated border-border rounded-card border px-3 py-3"
        >
          <p className="text-text-secondary text-[10px] font-medium uppercase tracking-wide">
            {item.label}
          </p>
          <p
            className={cn(
              'font-num mt-1 text-2xl font-semibold tabular-nums',
              item.accent && ACCENT_CLASS[item.accent],
            )}
          >
            {item.loading ? '—' : item.value}
          </p>
        </div>
      ))}
    </div>
  );
}
