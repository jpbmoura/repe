import { cn } from '@repe/ui';
import { Check } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export type SerieEstado = 'pending' | 'current' | 'done';

type Props = {
  numero: number;
  estado: SerieEstado;
  cargaSugerida: number | null;
  repsAlvo: string;
  cargaSalva?: number;
  repsSalvas?: number;
  isPR?: boolean;
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
  isPR = false,
  onConfirmar,
}: Props) {
  const [carga, setCarga] = useState<string>(
    () =>
      (cargaSalva ?? cargaSugerida ?? '').toString().replace('.', ',') || '',
  );
  const [reps, setReps] = useState<string>(() =>
    (repsSalvas ?? defaultReps(repsAlvo)).toString(),
  );

  useEffect(() => {
    if (estado === 'done') {
      setCarga((cargaSalva ?? 0).toString().replace('.', ','));
      setReps((repsSalvas ?? 0).toString());
    }
  }, [estado, cargaSalva, repsSalvas]);

  const checkRef = useRef<HTMLButtonElement>(null);
  const prevEstadoRef = useRef(estado);
  useEffect(() => {
    if (prevEstadoRef.current !== 'done' && estado === 'done') {
      checkRef.current?.animate(
        [
          { transform: 'scale(0.6)' },
          { transform: 'scale(1.08)' },
          { transform: 'scale(1)' },
        ],
        { duration: 240, easing: 'ease-out' },
      );
    }
    prevEstadoRef.current = estado;
  }, [estado]);

  const confirmar = () => {
    const cargaNum = Number(carga.replace(',', '.'));
    const repsNum = Number(reps);
    if (Number.isNaN(cargaNum) || Number.isNaN(repsNum)) return;
    tentarVibrar(15);
    onConfirmar(cargaNum, repsNum);
  };

  const cardClass = {
    pending: 'border-border bg-bg-elevated',
    current: 'border-accent bg-bg-elevated ring-1 ring-accent/30',
    done: 'border-success/30 bg-success/[0.06]',
  }[estado];

  const numClass = {
    pending: 'bg-bg-subtle text-text-tertiary',
    current: 'bg-accent text-bg-base',
    done: 'bg-success/15 text-success',
  }[estado];

  return (
    <div
      className={cn(
        'rounded-card border p-3 transition-colors duration-200',
        cardClass,
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'font-num flex h-12 w-12 shrink-0 items-center justify-center rounded-chip text-base font-bold transition-colors duration-200',
            numClass,
          )}
        >
          {numero}
        </div>

        <div className="grid flex-1 grid-cols-2 gap-3">
          <BigInput
            label="Kg"
            value={carga}
            onChange={setCarga}
            placeholder={cargaSugerida ? cargaSugerida.toString() : '—'}
            disabled={estado === 'done'}
            inputMode="decimal"
          />
          <BigInput
            label="Reps"
            value={reps}
            onChange={setReps}
            placeholder={repsAlvo}
            disabled={estado === 'done'}
            inputMode="numeric"
          />
        </div>

        {isPR && estado === 'done' && (
          <span className="bg-accent/15 text-accent shrink-0 rounded-pill px-2 py-1 text-[10px] font-bold uppercase tracking-wide">
            PR
          </span>
        )}

        <button
          ref={checkRef}
          type="button"
          onClick={confirmar}
          disabled={estado === 'done'}
          className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-colors duration-200',
            estado === 'done'
              ? 'bg-success text-bg-base'
              : estado === 'current'
                ? 'bg-accent text-bg-base hover:bg-accent-hover active:bg-accent-pressed active:scale-95'
                : 'bg-bg-subtle text-text-tertiary hover:bg-bg-subtle/80 active:scale-95',
          )}
          aria-label="Confirmar série"
        >
          <Check size={22} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
}

function BigInput({
  label,
  value,
  onChange,
  placeholder,
  disabled,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  inputMode?: 'numeric' | 'decimal';
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9.,]/g, ''))}
        placeholder={placeholder}
        disabled={disabled}
        inputMode={inputMode}
        className={cn(
          'font-num text-text-primary placeholder:text-text-tertiary w-full bg-transparent text-center text-2xl font-semibold tabular-nums outline-none',
          disabled && 'cursor-default',
        )}
      />
      <span className="text-text-tertiary mt-0.5 text-[10px] font-medium uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
}
