import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import { GRUPO_LABELS } from '@/lib/api/exercicios';
import {
  protocolosApi,
  protocolosKeys,
  type Treino,
  type VolumeResponse,
} from '@/lib/api/protocolos';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { AdicionarExercicioSheet } from './adicionar-exercicio-sheet';
import { DiasSemana } from './dias-semana';
import { ExercicioRow } from './exercicio-row';

type Props = {
  treino: Treino;
  protocoloId: string;
  bloqueado: boolean;
  volume?: VolumeResponse;
};

const formatTempo = (seg: number) => {
  if (!seg || seg < 60) return `${Math.round(seg)}s`;
  return `${Math.round(seg / 60)} min`;
};

function grupoPrincipalDoTreino(treino: Treino): string | null {
  if (treino.exercicios.length === 0) return null;
  const counts = new Map<string, number>();
  for (const ex of treino.exercicios) {
    const g = ex.exercicio.grupoMuscularPrimario;
    counts.set(g, (counts.get(g) ?? 0) + ex.series);
  }
  let melhor: { g: string; n: number } | null = null;
  for (const [g, n] of counts) {
    if (!melhor || n > melhor.n) melhor = { g, n };
  }
  return melhor?.g ?? null;
}

export function TreinoCard({ treino, protocoloId, bloqueado, volume }: Props) {
  const queryClient = useQueryClient();
  const [nome, setNome] = useState(treino.nome);
  const [diasSemana, setDiasSemana] = useState(treino.diasSemana);
  const [sheetOpen, setSheetOpen] = useState(false);

  const isFirstSync = useRef(true);

  useEffect(() => {
    setNome(treino.nome);
    setDiasSemana(treino.diasSemana);
    isFirstSync.current = true;
  }, [treino.id]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: protocolosKeys.detalhe(protocoloId) });
    queryClient.invalidateQueries({ queryKey: protocolosKeys.volume(protocoloId) });
  };

  const update = useMutation({
    mutationFn: (data: { nome?: string; diasSemana?: number[] }) =>
      protocolosApi.atualizarTreino(treino.id, data),
    onSuccess: invalidate,
  });

  const removerTreino = useMutation({
    mutationFn: () => protocolosApi.removerTreino(treino.id),
    onSuccess: invalidate,
  });

  const sendNomeUpdate = useDebouncedCallback((novoNome: string) => {
    update.mutate({ nome: novoNome });
  }, 800);

  const handleNomeChange = (v: string) => {
    setNome(v);
    sendNomeUpdate(v);
  };

  const handleDiasChange = (dias: number[]) => {
    setDiasSemana(dias);
    update.mutate({ diasSemana: dias });
  };

  const grupoPrincipal = grupoPrincipalDoTreino(treino);
  const tempoTreino = volume?.porTreino.find((t) => t.treinoId === treino.id);
  const seriesGrupoPrincipal = grupoPrincipal
    ? (volume?.porGrupo.find((g) => g.grupo === grupoPrincipal)?.series ?? null)
    : null;

  const grupoLabelLower = grupoPrincipal
    ? (
        GRUPO_LABELS[grupoPrincipal as keyof typeof GRUPO_LABELS] ?? grupoPrincipal
      ).toLowerCase()
    : null;

  return (
    <section className="space-y-4">
      <div className="space-y-3">
        <input
          value={nome}
          onChange={(e) => handleNomeChange(e.target.value)}
          disabled={bloqueado}
          placeholder="Nome do treino"
          className="placeholder:text-text-tertiary w-full bg-transparent text-2xl font-semibold tracking-tight outline-none disabled:opacity-60"
        />

        <DiasSemana value={diasSemana} onChange={handleDiasChange} size="sm" />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Stat
          label="Tempo"
          value={tempoTreino ? formatTempo(tempoTreino.tempoEstimadoSeg) : '—'}
        />
        <Stat label="Séries" value={tempoTreino?.totalSeries.toString() ?? '—'} />
        <Stat
          label={grupoLabelLower ? `${grupoLabelLower}/sem` : 'Volume'}
          value={
            seriesGrupoPrincipal !== null ? seriesGrupoPrincipal.toString() : '—'
          }
          accent="success"
        />
      </div>

      <div className="flex items-center justify-between pt-1">
        <h3 className="text-text-secondary text-xs font-semibold uppercase tracking-wide">
          Exercícios · {treino.exercicios.length}
        </h3>
        {!bloqueado && (
          <button
            type="button"
            onClick={() => removerTreino.mutate()}
            disabled={removerTreino.isPending}
            className="text-text-tertiary hover:text-danger inline-flex items-center gap-1 text-xs transition disabled:opacity-40"
          >
            <Trash2 size={12} />
            Remover treino
          </button>
        )}
      </div>

      <div className="space-y-2">
        {treino.exercicios.map((ex) => (
          <ExercicioRow
            key={ex.id}
            exercicio={ex}
            onRemoved={invalidate}
            onChanged={invalidate}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={() => setSheetOpen(true)}
        disabled={bloqueado}
        className="bg-bg-subtle/40 border-border hover:border-accent inline-flex w-full items-center justify-center gap-2 rounded-card border border-dashed py-4 text-sm font-medium transition disabled:opacity-40"
      >
        <Plus size={16} />
        Adicionar exercício
      </button>

      <AdicionarExercicioSheet
        treinoId={treino.id}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onAdded={() => {
          invalidate();
          setSheetOpen(false);
        }}
      />
    </section>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: 'success';
}) {
  return (
    <div className="bg-bg-elevated border-border rounded-card border px-3 py-2.5">
      <p className="text-text-secondary text-[10px] font-medium uppercase tracking-wide">
        {label}
      </p>
      <p
        className={
          'font-num mt-0.5 text-lg font-semibold tabular-nums ' +
          (accent === 'success' ? 'text-success' : '')
        }
      >
        {value}
      </p>
    </div>
  );
}
