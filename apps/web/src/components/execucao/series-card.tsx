import { cn } from '@repe/ui';
import { Check } from 'lucide-react';
import { useEffect, useState } from 'react';

export type SerieEstado = 'pending' | 'current' | 'done';

type Props = {
  numero: number;
  estado: SerieEstado;
  cargaSugerida: number | null;
  repsAlvo: string;
  cargaSalva?: number;
  repsSalvas?: number;
  onConfirmar: (carga: number, reps: number) => void;
};

function tentarVibrar(ms: number) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(ms);
  }
}

function defaultReps(repsAlvo: string): number {
  const match = repsAlvo.match(/(\d+)/g);
  if (!match || match.length === 0) return 10;
  if (match.length >= 2) return Number(match[1]);
  return Number(match[0]);
}

export function SeriesCard({
  numero,
  estado,
  cargaSugerida,
  repsAlvo,
  cargaSalva,
  repsSalvas,
  onConfirmar,
}: Props) {
  const [carga, setCarga] = useState<string>(
    () =>
      (cargaSalva ?? cargaSugerida ?? '').toString().replace('.', ',') || '',
  );
  const [reps, setReps] = useState<string>(
    () => (repsSalvas ?? defaultReps(repsAlvo)).toString(),
  );

  useEffect(() => {
    if (estado === 'done') {
      setCarga((cargaSalva ?? 0).toString().replace('.', ','));
      setReps((repsSalvas ?? 0).toString());
    }
  }, [estado, cargaSalva, repsSalvas]);

  const confirmar = () => {
    const cargaNum = Number(carga.replace(',', '.'));
    const repsNum = Number(reps);
    if (Number.isNaN(cargaNum) || Number.isNaN(repsNum)) return;
    tentarVibrar(15);
    onConfirmar(cargaNum, repsNum);
  };

  const borderClass = {
    pending: 'border-border',
    current: 'border-accent',
    done: 'border-success/40',
  }[estado];

  const numClass = {
    pending: 'bg-bg-subtle text-text-tertiary',
    current: 'bg-accent text-bg-base',
    done: 'bg-success/15 text-success',
  }[estado];

  return (
    <div
      className={cn(
        'bg-bg-elevated rounded-card border p-3 transition',
        borderClass,
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'font-num flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
            numClass,
          )}
        >
          {numero}
        </div>

        <div className="grid flex-1 grid-cols-2 gap-2">
          <NumberInput
            label="Carga"
            value={carga}
            onChange={setCarga}
            suffix="kg"
            placeholder={cargaSugerida ? cargaSugerida.toString() : '—'}
            disabled={estado === 'done'}
            inputMode="decimal"
          />
          <NumberInput
            label="Reps"
            value={reps}
            onChange={setReps}
            placeholder={repsAlvo}
            disabled={estado === 'done'}
            inputMode="numeric"
          />
        </div>

        <button
          type="button"
          onClick={confirmar}
          disabled={estado === 'done'}
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition',
            estado === 'done'
              ? 'bg-success/15 text-success'
              : estado === 'current'
                ? 'bg-accent text-bg-base hover:bg-accent-hover active:bg-accent-pressed'
                : 'bg-bg-subtle text-text-tertiary hover:bg-bg-subtle/80',
          )}
          aria-label="Confirmar série"
        >
          <Check size={20} />
        </button>
      </div>
    </div>
  );
}

function NumberInput({
  label,
  value,
  onChange,
  placeholder,
  suffix,
  disabled,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  suffix?: string;
  disabled?: boolean;
  inputMode?: 'numeric' | 'decimal';
}) {
  return (
    <label className="block">
      <span className="text-text-secondary mb-0.5 block text-[10px] uppercase tracking-wide">
        {label}
      </span>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^0-9.,]/g, ''))}
          placeholder={placeholder}
          disabled={disabled}
          inputMode={inputMode}
          className="font-num bg-bg-subtle border-border focus:border-accent w-full rounded-chip border px-3 py-2.5 text-base outline-none transition disabled:opacity-60"
        />
        {suffix && (
          <span className="text-text-tertiary pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs">
            {suffix}
          </span>
        )}
      </div>
    </label>
  );
}
