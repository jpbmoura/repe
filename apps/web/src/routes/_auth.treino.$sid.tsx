import { Chip } from '@/components/chip';
import { RestTimer } from '@/components/execucao/rest-timer';
import {
  SeriesCard,
  type SerieEstado,
} from '@/components/execucao/series-card';
import { YouTubeEmbed } from '@/components/execucao/youtube-embed';
import { Textarea } from '@/components/field';
import { EQUIPAMENTO_LABELS, GRUPO_LABELS } from '@/lib/api/exercicios';
import {
  sessoesApi,
  sessoesKeys,
  type ExercicioTreino,
  type SerieExecutada,
} from '@/lib/api/sessoes';
import { cn } from '@repe/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';

export const Route = createFileRoute('/_auth/treino/$sid')({
  component: ExecucaoPage,
});

function ExecucaoPage() {
  const { sid } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isPending } = useQuery({
    queryKey: sessoesKeys.detalhe(sid),
    queryFn: () => sessoesApi.detalhe(sid),
  });

  const [exercicioIdx, setExercicioIdx] = useState(0);
  const [restTimer, setRestTimer] = useState<{
    key: number;
    segundos: number;
  } | null>(null);
  const [observacao, setObservacao] = useState('');
  const [resumo, setResumo] = useState(false);

  const seriesPorExercicio = useMemo(() => {
    if (!data) return new Map<string, SerieExecutada[]>();
    const map = new Map<string, SerieExecutada[]>();
    for (const s of data.sessao.series) {
      const arr = map.get(s.exercicioTreinoId) ?? [];
      arr.push(s);
      map.set(s.exercicioTreinoId, arr);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => a.numeroSerie - b.numeroSerie);
    }
    return map;
  }, [data]);

  const registrarSerie = useMutation({
    mutationFn: (vars: {
      exercicioTreinoId: string;
      numeroSerie: number;
      cargaKg: number;
      repsFeitas: number;
    }) =>
      sessoesApi.registrarSerie(sid, {
        exercicioTreinoId: vars.exercicioTreinoId,
        numeroSerie: vars.numeroSerie,
        cargaKg: vars.cargaKg,
        repsFeitas: vars.repsFeitas,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessoesKeys.detalhe(sid) });
    },
  });

  const finalizar = useMutation({
    mutationFn: () =>
      sessoesApi.finalizar(sid, {
        observacaoAluno: observacao.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessoesKeys.hoje() });
      queryClient.invalidateQueries({
        queryKey: sessoesKeys.historico(),
      });
      navigate({ to: '/hoje' });
    },
  });

  if (isPending) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-text-secondary text-sm">Carregando…</p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-danger text-sm">Sessão não encontrada.</p>
      </main>
    );
  }

  const { sessao } = data;
  const exercicios = sessao.treino.exercicios;
  const exercicioAtual = exercicios[exercicioIdx];

  if (!exercicioAtual) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-text-secondary text-sm">Sem exercícios.</p>
      </main>
    );
  }

  const seriesDoAtual = seriesPorExercicio.get(exercicioAtual.id) ?? [];
  const totalConcluidas = exercicios.reduce(
    (acc, ex) =>
      acc + Math.min(ex.series, (seriesPorExercicio.get(ex.id) ?? []).length),
    0,
  );
  const totalSeries = exercicios.reduce((acc, ex) => acc + ex.series, 0);
  const tudoFeito = totalConcluidas >= totalSeries;

  const handleConfirmar = (
    exTreinoId: string,
    numero: number,
    descanso: number,
    cargaKg: number,
    repsFeitas: number,
  ) => {
    registrarSerie.mutate({
      exercicioTreinoId: exTreinoId,
      numeroSerie: numero,
      cargaKg,
      repsFeitas,
    });
    setRestTimer({ key: Date.now(), segundos: descanso });
  };

  if (resumo || tudoFeito) {
    return (
      <ResumoFinal
        exercicios={exercicios}
        seriesPorExercicio={seriesPorExercicio}
        observacao={observacao}
        onObservacao={setObservacao}
        onFinalizar={() => finalizar.mutate()}
        finalizando={finalizar.isPending}
        onVoltar={() => setResumo(false)}
      />
    );
  }

  return (
    <main className="pb-nav-action mx-auto max-w-2xl px-4 pt-4">
      <header className="mb-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate({ to: '/hoje' })}
          className="text-text-secondary hover:text-text-primary inline-flex h-9 w-9 items-center justify-center"
          aria-label="Voltar"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1 text-center">
          <p className="text-text-tertiary text-[10px] font-semibold uppercase tracking-wider">
            Treino {sessao.treino.letra} · {sessao.treino.nome}
          </p>
          <p className="font-num text-text-primary mt-0.5 text-xs tabular-nums">
            <span className="text-accent font-semibold">
              {exercicioIdx + 1}
            </span>
            <span className="text-text-secondary">
              {' '}
              de {exercicios.length} exercícios
            </span>
          </p>
        </div>
        <div className="w-9" aria-hidden />
      </header>

      <div className="bg-bg-subtle relative mb-6 h-1 overflow-hidden rounded-full">
        <div
          className="bg-accent absolute inset-y-0 left-0 transition-[width] duration-300"
          style={{
            width: `${
              totalSeries > 0 ? (totalConcluidas / totalSeries) * 100 : 0
            }%`,
          }}
        />
      </div>

      <h1 className="text-3xl font-semibold leading-tight tracking-tight">
        {exercicioAtual.exercicio.nome}
      </h1>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <Chip variant="subtle">
          {GRUPO_LABELS[exercicioAtual.exercicio.grupoMuscularPrimario]}
        </Chip>
        <Chip variant="subtle">{exercicioAtual.exercicio.categoria}</Chip>
        <Chip variant="subtle">
          {EQUIPAMENTO_LABELS[exercicioAtual.exercicio.equipamento]}
        </Chip>
      </div>

      {exercicioAtual.exercicio.youtubeId && (
        <div className="mt-5">
          <YouTubeEmbed youtubeId={exercicioAtual.exercicio.youtubeId} />
        </div>
      )}

      <div className="bg-bg-elevated border-border mt-5 rounded-card border px-4 py-3">
        <p className="text-text-secondary text-[10px] font-semibold uppercase tracking-wider">
          Alvo do treino
        </p>
        <p className="font-num mt-0.5 text-sm tabular-nums">
          <span className="font-semibold">
            {exercicioAtual.series} × {exercicioAtual.repsAlvo} reps
          </span>
          <span className="text-text-secondary">
            {' '}
            · descanso {exercicioAtual.descansoSegundos}s
          </span>
        </p>
      </div>

      {exercicioAtual.observacao && (
        <div className="bg-bg-subtle border-border mt-3 rounded-card border p-3 text-sm">
          <p className="text-text-secondary text-xs">Observação do personal</p>
          <p className="mt-1 whitespace-pre-wrap">{exercicioAtual.observacao}</p>
        </div>
      )}

      <section className="mt-5">
        <h2 className="text-text-secondary mb-3 text-[10px] font-semibold uppercase tracking-wider">
          Séries
        </h2>
        <div className="space-y-2">
          {Array.from({ length: exercicioAtual.series }, (_, i) => i + 1).map(
            (numero) => {
              const salva = seriesDoAtual.find((s) => s.numeroSerie === numero);
              const concluidasAteAgora = seriesDoAtual.length;
              const estado: SerieEstado = salva
                ? 'done'
                : numero === concluidasAteAgora + 1
                  ? 'current'
                  : 'pending';

              const cargaSalva = salva ? Number(salva.cargaKg) : undefined;
              const ultimaCarga = exercicioAtual.ultimaExecucao
                ? Number(exercicioAtual.ultimaExecucao.cargaKg)
                : null;
              const isPR =
                cargaSalva !== undefined &&
                ultimaCarga !== null &&
                cargaSalva > ultimaCarga;

              return (
                <SeriesCard
                  key={`${exercicioAtual.id}-${numero}`}
                  numero={numero}
                  estado={estado}
                  cargaSugerida={
                    exercicioAtual.cargaSugeridaKg
                      ? Number(exercicioAtual.cargaSugeridaKg)
                      : ultimaCarga
                  }
                  repsAlvo={exercicioAtual.repsAlvo}
                  cargaSalva={cargaSalva}
                  repsSalvas={salva?.repsFeitas}
                  isPR={isPR}
                  onConfirmar={(carga, reps) =>
                    handleConfirmar(
                      exercicioAtual.id,
                      numero,
                      exercicioAtual.descansoSegundos,
                      carga,
                      reps,
                    )
                  }
                />
              );
            },
          )}
        </div>
      </section>

      {exercicioAtual.ultimaExecucao && (
        <p className="text-text-tertiary mt-3 text-xs">
          Última execução:{' '}
          <span className="font-num text-text-secondary tabular-nums">
            {Number(exercicioAtual.ultimaExecucao.cargaKg)}kg ×{' '}
            {exercicioAtual.ultimaExecucao.repsFeitas} reps
          </span>
        </p>
      )}

      <div className="mt-6 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setExercicioIdx((i) => Math.max(0, i - 1))}
          disabled={exercicioIdx === 0}
          className="bg-bg-subtle border-border inline-flex items-center gap-1 rounded-pill border px-4 py-2 text-sm font-medium disabled:opacity-40"
        >
          <ChevronLeft size={14} />
          Anterior
        </button>
        {exercicioIdx < exercicios.length - 1 ? (
          <button
            type="button"
            onClick={() => setExercicioIdx((i) => i + 1)}
            className="bg-bg-subtle border-border inline-flex items-center gap-1 rounded-pill border px-4 py-2 text-sm font-medium"
          >
            Próximo
            <ChevronRight size={14} />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setResumo(true)}
            className="bg-accent text-bg-base hover:bg-accent-hover rounded-pill px-4 py-2 text-sm font-semibold"
          >
            Finalizar
          </button>
        )}
      </div>

      {restTimer && (
        <RestTimer
          key={restTimer.key}
          segundosIniciais={restTimer.segundos}
          onPular={() => setRestTimer(null)}
        />
      )}
    </main>
  );
}

function ResumoFinal({
  exercicios,
  seriesPorExercicio,
  observacao,
  onObservacao,
  onFinalizar,
  finalizando,
  onVoltar,
}: {
  exercicios: ExercicioTreino[];
  seriesPorExercicio: Map<string, SerieExecutada[]>;
  observacao: string;
  onObservacao: (v: string) => void;
  onFinalizar: () => void;
  finalizando: boolean;
  onVoltar: () => void;
}) {
  const tonelagemTotal = exercicios.reduce((acc, ex) => {
    const series = seriesPorExercicio.get(ex.id) ?? [];
    return (
      acc + series.reduce((a, s) => a + Number(s.cargaKg) * s.repsFeitas, 0)
    );
  }, 0);

  const totalSeries = exercicios.reduce(
    (acc, ex) => acc + (seriesPorExercicio.get(ex.id)?.length ?? 0),
    0,
  );

  const prsCount = exercicios.reduce((acc, ex) => {
    const series = seriesPorExercicio.get(ex.id) ?? [];
    const ultima = ex.ultimaExecucao ? Number(ex.ultimaExecucao.cargaKg) : null;
    if (ultima === null) return acc;
    const teve = series.some((s) => Number(s.cargaKg) > ultima);
    return acc + (teve ? 1 : 0);
  }, 0);

  return (
    <main className="pb-nav mx-auto max-w-2xl px-4 pt-6">
      <header className="mb-6">
        <p className="text-text-secondary text-sm">Resumo</p>
        <h1 className="text-2xl font-semibold">Quase lá</h1>
      </header>

      <div className="grid grid-cols-3 gap-2">
        <Stat label="Séries" value={totalSeries.toString()} />
        <Stat
          label="Tonelagem"
          value={`${Math.round(tonelagemTotal).toLocaleString('pt-BR')} kg`}
        />
        <Stat label="PRs" value={prsCount.toString()} accent="success" />
      </div>

      <ul className="mt-6 space-y-2">
        {exercicios.map((ex) => {
          const series = seriesPorExercicio.get(ex.id) ?? [];
          return (
            <li
              key={ex.id}
              className="bg-bg-elevated border-border rounded-card border p-3"
            >
              <p className="font-medium">{ex.exercicio.nome}</p>
              <p className="font-num text-text-secondary mt-0.5 text-xs tabular-nums">
                <span>
                  {series.length}/{ex.series}
                </span>
                {series.length > 0 && (
                  <>
                    {' · '}
                    {series
                      .map((s) => `${Number(s.cargaKg)}×${s.repsFeitas}`)
                      .join(' / ')}
                  </>
                )}
              </p>
            </li>
          );
        })}
      </ul>

      <div className="mt-6">
        <Textarea
          label="Como foi o treino? (opcional)"
          rows={3}
          value={observacao}
          onChange={(e) => onObservacao(e.target.value)}
          placeholder="Energia, dor, progressão…"
        />
      </div>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
        <button
          type="button"
          onClick={onFinalizar}
          disabled={finalizando}
          className="bg-accent text-bg-base hover:bg-accent-hover active:bg-accent-pressed disabled:opacity-60 flex-1 rounded-pill py-3 font-semibold transition"
        >
          {finalizando ? 'Finalizando…' : 'Finalizar treino'}
        </button>
        <button
          type="button"
          onClick={onVoltar}
          className="bg-bg-subtle border-border flex-1 rounded-pill border py-3 text-sm font-medium"
        >
          Voltar
        </button>
      </div>
    </main>
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
    <div className="bg-bg-elevated border-border rounded-card border px-3 py-3">
      <p className="text-text-secondary text-[10px] font-medium uppercase tracking-wide">
        {label}
      </p>
      <p
        className={cn(
          'font-num mt-1 text-lg font-semibold tabular-nums',
          accent === 'success' && 'text-success',
        )}
      >
        {value}
      </p>
    </div>
  );
}
