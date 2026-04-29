import { cn } from '@repe/ui';
import { Plus, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type Props = {
  segundosIniciais: number;
  onConcluir?: () => void;
  onPular: () => void;
};

function formatTempo(s: number): string {
  const min = Math.floor(s / 60);
  const seg = s % 60;
  return `${min.toString().padStart(2, '0')}:${seg.toString().padStart(2, '0')}`;
}

function tentarVibrar(pattern: number | number[]) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
}

type WakeLockSentinelLike = {
  released: boolean;
  release: () => Promise<void>;
};

export function RestTimer({ segundosIniciais, onConcluir, onPular }: Props) {
  const [restante, setRestante] = useState(segundosIniciais);
  const [encerrado, setEncerrado] = useState(false);
  const wakeLockRef = useRef<WakeLockSentinelLike | null>(null);

  useEffect(() => {
    setRestante(segundosIniciais);
    setEncerrado(false);
  }, [segundosIniciais]);

  useEffect(() => {
    const acquire = async () => {
      try {
        const wl = await (
          navigator as {
            wakeLock?: { request: (kind: string) => Promise<WakeLockSentinelLike> };
          }
        ).wakeLock?.request('screen');
        if (wl) wakeLockRef.current = wl;
      } catch {
        // ignore
      }
    };
    void acquire();
    return () => {
      const wl = wakeLockRef.current;
      if (wl && !wl.released) void wl.release();
      wakeLockRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (encerrado) return;
    if (restante <= 0) {
      setEncerrado(true);
      tentarVibrar([100, 50, 100]);
      onConcluir?.();
      return;
    }
    const t = setTimeout(() => setRestante((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [restante, encerrado, onConcluir]);

  return (
    <div
      className={cn(
        'pointer-events-auto fixed inset-x-0 bottom-16 z-40 px-3 pb-2',
        'mx-auto max-w-2xl',
      )}
      style={{
        paddingBottom: 'max(env(safe-area-inset-bottom), 0.5rem)',
      }}
    >
      <div
        data-anim="slide-up"
        className={cn(
          'border-border-strong flex items-center gap-3 rounded-card border-2 p-4 shadow-xl transition-colors duration-200',
          encerrado ? 'bg-success/15' : 'bg-bg-elevated',
        )}
      >
        <div className="flex flex-1 items-baseline gap-3">
          <span className="text-text-secondary text-[10px] font-semibold uppercase tracking-wider">
            {encerrado ? 'Pronto' : 'Descanso'}
          </span>
          <span
            className={cn(
              'font-num text-4xl font-bold tabular-nums leading-none',
              encerrado ? 'text-success' : 'text-accent',
            )}
          >
            {formatTempo(Math.max(0, restante))}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setRestante((s) => s + 15)}
          className="bg-bg-subtle border-border inline-flex items-center gap-1 rounded-pill border px-3 py-2 text-xs font-medium transition active:scale-95"
        >
          <Plus size={12} strokeWidth={2.5} />
          15s
        </button>
        <button
          type="button"
          onClick={onPular}
          className="bg-accent text-bg-base hover:bg-accent-hover inline-flex items-center gap-1 rounded-pill px-3 py-2 text-xs font-semibold transition active:scale-95"
          aria-label="Pular descanso"
        >
          <X size={12} strokeWidth={2.5} />
          Pular
        </button>
      </div>
    </div>
  );
}
