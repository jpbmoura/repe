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
  return `${min}:${seg.toString().padStart(2, '0')}`;
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
        const wl = await (navigator as { wakeLock?: { request: (kind: string) => Promise<WakeLockSentinelLike> } }).wakeLock?.request('screen');
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
        'pointer-events-auto fixed inset-x-0 bottom-0 z-40 px-3 pb-3',
        'mx-auto max-w-2xl',
      )}
    >
      <div className="bg-bg-elevated border-border rounded-card border-2 p-4 shadow-xl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-text-secondary text-xs">
              {encerrado ? 'Descanso concluído' : 'Descansando'}
            </p>
            <p
              className={cn(
                'font-num text-3xl font-semibold tabular-nums',
                encerrado ? 'text-success' : 'text-accent',
              )}
            >
              {formatTempo(Math.max(0, restante))}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setRestante((s) => s + 15)}
              className="bg-bg-subtle border-border inline-flex items-center gap-1 rounded-pill border px-3 py-2 text-sm font-medium"
            >
              <Plus size={14} />
              15s
            </button>
            <button
              type="button"
              onClick={onPular}
              className="bg-bg-subtle border-border inline-flex items-center gap-1 rounded-pill border px-3 py-2 text-sm font-medium"
              aria-label="Pular"
            >
              <X size={14} />
              Pular
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
