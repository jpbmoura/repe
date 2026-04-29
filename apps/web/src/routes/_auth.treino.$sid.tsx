import { Textarea } from '@/components/field';
import { RestTimer } from '@/components/execucao/rest-timer';
import {
  SeriesCard,
  type SerieEstado,
} from '@/components/execucao/series-card';
import { YouTubeEmbed } from '@/components/execucao/youtube-embed';
import {
  sessoesApi,
  sessoesKeys,
  type SerieExecutada,
  type ExercicioTreino,
} from '@/lib/api/sessoes';
import { GRUPO_LABELS } from '@/lib/api/exercicios';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  createFileRoute,
  useNavigate,
} from '@tanstack/react-router';
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
      acc +
      Math.min(ex.series, (seriesPorExercicio.get(ex.id) ?? []).length),
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
    <main className="mx-auto max-w-2xl px-4 py-6 pb-40">
      <header className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate({ to: '/hoje' })}
          className="text-text-secondary hover:text-text-primary inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft size={16} />
          Hoje
        </button>
        <p className="text-text-secondary font-num text-xs">
          {totalConcluidas}/{totalSeries} séries
        </p>
      </header>

      <div className="bg-bg-elevated border-border mb-4 rounded-card border p-2">
        <div className="bg-bg-subtle relative h-1.5 overflow-hidden rounded-full">
          <div
            className="bg-accent absolute inset-y-0 left-0 transition-[width]"
            style={{
              width: `${totalSeries > 0 ? (totalConcluidas / totalSeries) * 100 : 0}%`,
            }}
          />
        </div>
      </div>

      <NavExercicios
        exercicios={exercicios}
        atual={exercicioIdx}
        onSelecionar={setExercicioIdx}
        seriesPorExercicio={seriesPorExercicio}
      />

      <section className="mt-5">
        <p className="text-text-secondary text-xs uppercase tracking-wide">
          Exercício {exercicioIdx + 1} de {exercicios.length}
        </p>
        <h1 className="text-xl font-semibold">{exercicioAtual.exercicio.nome}</h1>
        <p className="text-text-secondary mt-1 text-sm">
          {GRUPO_LABELS[exercicioAtual.exercicio.grupoMuscularPrimario]}
          {' · '}
          <span className="font-num">
            {exercicioAtual.series}x{exercicioAtual.repsAlvo}
          </span>
          {' · descanso '}
          <span className="font-num">{exercicioAtual.descansoSegundos}s</span>
        </p>

        {exercicioAtual.exercicio.youtubeId && (
          <div className="mt-4">
            <YouTubeEmbed youtubeId={exercicioAtual.exercicio.youtubeId} />
          </div>
        )}

        {exercicioAtual.observacao && (
          <div className="bg-bg-subtle border-border mt-4 rounded-card border p-3 text-sm">
            <p className="text-text-secondary text-xs">Observação do personal</p>
            <p className="mt-1 whitespace-pre-wrap">
              {exercicioAtual.observacao}
            </p>
          </div>
        )}

        {exercicioAtual.ultimaExecucao && (
          <p className="text-text-tertiary mt-3 text-xs">
            Última execução:{' '}
            <span className="font-num text-text-secondary">
              {Number(exercicioAtual.ultimaExecucao.cargaKg)}kg ×{' '}
              {exercicioAtual.ultimaExecucao.repsFeitas} reps
            </span>
          </p>
        )}

        <div className="mt-5 space-y-2">
          {Array.from({ length: exercicioAtual.series }, (_, i) => i + 1).map(
            (numero) => {
              const salva = seriesDoAtual.find((s) => s.numeroSerie === numero);
              const concluidasAteAgora = seriesDoAtual.length;
              const estado: SerieEstado = salva
                ? 'done'
                : numero === concluidasAteAgora + 1
                  ? 'current'
                  : 'pending';
              return (
                <SeriesCard
                  key={`${exercicioAtual.id}-${numero}`}
                  numero={numero}
                  estado={estado}
                  cargaSugerida={
                    exercicioAtual.cargaSugeridaKg
                      ? Number(exercicioAtual.cargaSugeridaKg)
                      : exercicioAtual.ultimaExecucao
                        ? Number(exercicioAtual.ultimaExecucao.cargaKg)
                        : null
                  }
                  repsAlvo={exercicioAtual.repsAlvo}
                  cargaSalva={salva ? Number(salva.cargaKg) : undefined}
                  repsSalvas={salva?.repsFeitas}
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
              className="bg-accent text-bg-base hover:bg-accent-hover rounded-pill px-4 py-2 text-sm font-medium"
            >
              Finalizar
            </button>
          )}
        </div>
      </section>

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

function NavExercicios({
  exercicios,
  atual,
  onSelecionar,
  seriesPorExercicio,
}: {
  exercicios: ExercicioTreino[];
  atual: number;
  onSelecionar: (i: number) => void;
  seriesPorExercicio: Map<string, SerieExecutada[]>;
}) {
  return (
    <nav
      className="-mx-4 overflow-x-auto px-4"
      aria-label="Exercícios do treino"
    >
      <ol className="flex min-w-max gap-2">
        {exercicios.map((ex, i) => {
          const concluidas = seriesPorExercicio.get(ex.id)?.length ?? 0;
          const completo = concluidas >= ex.series;
          const ativo = i === atual;
          return (
            <li key={ex.id}>
              <button
                type="button"
                onClick={() => onSelecionar(i)}
                className={
                  'rounded-pill px-3 py-1.5 text-xs font-medium transition ' +
                  (ativo
                    ? 'bg-accent text-bg-base'
                    : completo
                      ? 'bg-success/15 text-success'
                      : 'bg-bg-subtle text-text-secondary')
                }
              >
                <span className="font-num mr-1">{i + 1}</span>
                {ex.exercicio.nome.split(' ').slice(0, 2).join(' ')}
                <span className="font-num ml-1.5 opacity-70">
                  {concluidas}/{ex.series}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
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

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <header className="mb-6">
        <p className="text-text-secondary text-sm">Resumo do treino</p>
        <h1 className="text-2xl font-semibold">Quase lá</h1>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <Stat label="Séries feitas" value={totalSeries.toString()} />
        <Stat
          label="Tonelagem"
          value={`${Math.round(tonelagemTotal).toLocaleString('pt-BR')} kg`}
        />
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
              <p className="text-text-secondary mt-0.5 text-xs">
                <span className="font-num">
                  {series.length}/{ex.series}
                </span>{' '}
                séries{' · '}
                {series.length > 0 && (
                  <span className="font-num">
                    {series.map((s) => `${Number(s.cargaKg)}×${s.repsFeitas}`).join(' / ')}
                  </span>
                )}
              </p>
            </li>
          );
        })}
      </ul>

      <div className="mt-5">
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-bg-elevated border-border rounded-card border p-4">
      <p className="text-text-secondary text-xs uppercase tracking-wide">
        {label}
      </p>
      <p className="font-num mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}
