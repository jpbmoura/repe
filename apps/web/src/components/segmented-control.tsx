import { cn } from '@repe/ui';
import { useEffect, useRef, useState } from 'react';

type Item<T extends string> = {
  value: T;
  label: string;
  badge?: number | string;
};

type Props<T extends string> = {
  items: Item<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
};

export function SegmentedControl<T extends string>({
  items,
  value,
  onChange,
  className,
}: Props<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonsRef = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [indicator, setIndicator] = useState<{ x: number; w: number } | null>(
    null,
  );

  useEffect(() => {
    const update = () => {
      const btn = buttonsRef.current.get(value);
      const container = containerRef.current;
      if (!btn || !container) return;
      const containerRect = container.getBoundingClientRect();
      const btnRect = btn.getBoundingClientRect();
      setIndicator({
        x: btnRect.left - containerRect.left,
        w: btnRect.width,
      });
    };
    update();
    const ro = new ResizeObserver(update);
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [value, items]);

  return (
    <div
      ref={containerRef}
      role="tablist"
      className={cn(
        'bg-bg-subtle border-border relative inline-flex w-full rounded-chip border p-1',
        className,
      )}
    >
      {indicator && (
        <span
          aria-hidden
          className="bg-accent absolute inset-y-1 rounded-chip transition-[transform,width] duration-200 ease-out"
          style={{
            transform: `translateX(${indicator.x - 4}px)`,
            width: `${indicator.w}px`,
          }}
        />
      )}
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            ref={(el) => {
              if (el) buttonsRef.current.set(item.value, el);
              else buttonsRef.current.delete(item.value);
            }}
            role="tab"
            aria-selected={active}
            type="button"
            onClick={() => onChange(item.value)}
            className={cn(
              'relative z-1 inline-flex flex-1 items-center justify-center gap-1.5 rounded-chip px-3 py-2 text-sm font-medium transition-colors duration-200 active:scale-[0.97]',
              active
                ? 'text-bg-base'
                : 'text-text-secondary hover:text-text-primary',
            )}
          >
            {item.label}
            {item.badge !== undefined && (
              <span
                className={cn(
                  'font-num rounded-full px-1.5 text-[10px] font-semibold transition-colors',
                  active
                    ? 'bg-bg-base/20'
                    : 'bg-bg-elevated text-text-tertiary',
                )}
              >
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
