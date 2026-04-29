import { cn } from '@repe/ui';

const DIAS = [
  { num: 1, label: 'S' },
  { num: 2, label: 'T' },
  { num: 3, label: 'Q' },
  { num: 4, label: 'Q' },
  { num: 5, label: 'S' },
  { num: 6, label: 'S' },
  { num: 0, label: 'D' },
] as const;

type Props = {
  value: number[];
  onChange: (value: number[]) => void;
  size?: 'sm' | 'md';
};

export function DiasSemana({ value, onChange, size = 'md' }: Props) {
  const toggle = (dia: number) => {
    if (value.includes(dia)) {
      onChange(value.filter((d) => d !== dia));
    } else {
      onChange([...value, dia].sort((a, b) => a - b));
    }
  };

  return (
    <div className="flex gap-1.5">
      {DIAS.map((d) => {
        const ativo = value.includes(d.num);
        return (
          <button
            key={d.num}
            type="button"
            onClick={() => toggle(d.num)}
            className={cn(
              'rounded-full font-medium transition',
              size === 'sm'
                ? 'h-8 w-8 text-xs'
                : 'h-10 w-10 text-sm',
              ativo
                ? 'bg-accent text-bg-base'
                : 'bg-bg-subtle text-text-secondary hover:text-text-primary',
            )}
            aria-pressed={ativo}
            aria-label={d.label}
          >
            {d.label}
          </button>
        );
      })}
    </div>
  );
}
