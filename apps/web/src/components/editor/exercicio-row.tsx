import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import {
  protocolosApi,
  type ExercicioTreino,
} from '@/lib/api/protocolos';
import { cn } from '@repe/ui';
import { useMutation } from '@tanstack/react-query';
import { ChevronDown, GripVertical, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { ExercicioIcone } from './exercicio-icone';

type Props = {
  exercicio: ExercicioTreino;
  onRemoved: () => void;
  onChanged: () => void;
};

export function ExercicioRow({ exercicio, onRemoved, onChanged }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [series, setSeries] = useState(exercicio.series);
  const [repsAlvo, setRepsAlvo] = useState(exercicio.repsAlvo);
  const [cargaSugeridaKg, setCargaSugeridaKg] = useState(
    exercicio.cargaSugeridaKg ?? '',
  );
  const [descansoSegundos, setDescansoSegundos] = useState(
    exercicio.descansoSegundos,
  );

  const isFirstSync = useRef(true);

  useEffect(() => {
    setSeries(exercicio.series);
    setRepsAlvo(exercicio.repsAlvo);
    setCargaSugeridaKg(exercicio.cargaSugeridaKg ?? '');
    setDescansoSegundos(exercicio.descansoSegundos);
    isFirstSync.current = true;
  }, [exercicio.id]);

  const update = useMutation({
    mutationFn: (data: {
      series?: number;
      repsAlvo?: string;
      cargaSugeridaKg?: number | null;
      descansoSegundos?: number;
    }) => protocolosApi.atualizarExercicio(exercicio.id, data),
    onSuccess: () => onChanged(),
  });

  const remover = useMutation({
    mutationFn: () => protocolosApi.removerExercicio(exercicio.id),
    onSuccess: () => onRemoved(),
  });

  const sendUpdate = useDebouncedCallback(() => {
    update.mutate({
      series,
      repsAlvo,
      cargaSugeridaKg: cargaSugeridaKg === '' ? null : Number(cargaSugeridaKg),
      descansoSegundos,
    });
  }, 800);

  useEffect(() => {
    if (isFirstSync.current) {
      isFirstSync.current = false;
      return;
    }
    sendUpdate();
  }, [series, repsAlvo, cargaSugeridaKg, descansoSegundos, sendUpdate]);

  const cargaTxt = cargaSugeridaKg === '' ? '—' : `${cargaSugeridaKg}kg`;
  const descansoTxt = `${descansoSegundos}s`;
  const summary = `${series}×${repsAlvo} · ${cargaTxt} · ${descansoTxt}`;

  return (
    <div
      className={cn(
        'bg-bg-elevated border-border overflow-hidden rounded-card border transition',
        expanded && 'border-border-strong',
      )}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-2 p-3 text-left"
      >
        <GripVertical
          size={16}
          className="text-text-tertiary shrink-0 cursor-grab"
          aria-hidden
        />
        <div className="bg-bg-subtle text-text-secondary flex h-9 w-9 shrink-0 items-center justify-center rounded-chip">
          <ExercicioIcone equipamento={exercicio.exercicio.equipamento} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{exercicio.exercicio.nome}</p>
          <p className="font-num text-text-secondary mt-0.5 text-xs tabular-nums">
            {summary}
          </p>
        </div>
        <ChevronDown
          size={16}
          className={cn(
            'text-text-tertiary shrink-0 transition-transform',
            expanded && 'rotate-180',
          )}
          aria-hidden
        />
      </button>

      {expanded && (
        <div className="border-border space-y-3 border-t p-3">
          <div className="grid grid-cols-4 gap-2">
            <NumField
              label="Séries"
              value={series}
              onChange={(v) => setSeries(Math.max(1, Math.round(v)))}
              min={1}
            />
            <TextField
              label="Reps"
              value={repsAlvo}
              onChange={setRepsAlvo}
              placeholder="8-12"
            />
            <TextField
              label="Carga"
              value={cargaSugeridaKg.toString()}
              onChange={(v) => setCargaSugeridaKg(v.replace(',', '.'))}
              placeholder="kg"
              inputMode="decimal"
            />
            <NumField
              label="Desc."
              value={descansoSegundos}
              onChange={(v) => setDescansoSegundos(Math.max(0, Math.round(v)))}
              min={0}
              step={5}
              suffix="s"
            />
          </div>

          <button
            type="button"
            onClick={() => remover.mutate()}
            disabled={remover.isPending}
            className="text-text-tertiary hover:text-danger inline-flex items-center gap-1 text-xs transition"
          >
            <Trash2 size={12} />
            Remover exercício
          </button>
        </div>
      )}
    </div>
  );
}

function NumField({
  label,
  value,
  onChange,
  min,
  step = 1,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  step?: number;
  suffix?: string;
}) {
  return (
    <label className="block">
      <span className="text-text-secondary mb-0.5 block text-[10px] uppercase tracking-wide">
        {label}
      </span>
      <div className="relative">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          min={min}
          step={step}
          inputMode="numeric"
          className="font-num bg-bg-subtle border-border focus:border-accent w-full rounded-chip border px-2 py-2 text-sm outline-none"
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

function TextField({
  label,
  value,
  onChange,
  placeholder,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  inputMode?: 'text' | 'numeric' | 'decimal';
}) {
  return (
    <label className="block">
      <span className="text-text-secondary mb-0.5 block text-[10px] uppercase tracking-wide">
        {label}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        className="font-num bg-bg-subtle border-border focus:border-accent w-full rounded-chip border px-2 py-2 text-sm outline-none"
      />
    </label>
  );
}
