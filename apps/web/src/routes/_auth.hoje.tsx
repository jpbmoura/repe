import { Avatar } from '@/components/avatar';
import { Chip } from '@/components/chip';
import { GRUPO_LABELS } from '@/lib/api/exercicios';
import { sessoesApi, sessoesKeys } from '@/lib/api/sessoes';
import { cn } from '@repe/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ChevronRight, Dumbbell, Play } from 'lucide-react';

export const Route = createFileRoute('/_auth/hoje')({
  component: HojePage,
});

const NOMES_DIA = [
  'Domingo',
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
];

function saudacao(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Boa noite';
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

function HojePage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isPending } = useQuery({
    queryKey: sessoesKeys.hoje(),
    queryFn: () => sessoesApi.hoje(),
  });

  const iniciar = useMutation({
    mutationFn: () => {
      if (!data?.treino) throw new Error('sem_treino');
      return sessoesApi.iniciar({ treinoId: data.treino.id });
    },
    onSuccess: ({ sessao }) => {
      queryClient.invalidateQueries({ queryKey: sessoesKeys.hoje() });
      navigate({ to: '/treino/$sid', params: { sid: sessao.id } });
    },
  });

  const hojeNome = NOMES_DIA[new Date().getDay()] ?? 'Olá';

  if (isPending) {
    return (
      <main className="mx-auto max-w-xl px-4 py-8">
        <p className="text-text-secondary text-sm">Carregando…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-xl px-4 pb-32 pt-6">
      <header className="mb-6 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-text-secondary text-sm">
            {saudacao()}, {hojeNome.toLowerCase()}
          </p>
          <h1 className="truncate text-2xl font-semibold">{user.nome}</h1>
        </div>
        <Avatar nome={user.nome} size="lg" variant="neutral" />
      </header>

      {!data?.protocolo && (
        <div className="bg-bg-elevated border-border rounded-card border p-6 text-center">
          <Dumbbell size={32} className="text-text-tertiary mx-auto mb-3" />
          <p className="font-medium">Sem protocolo ativo</p>
          <p className="text-text-secondary mt-1 text-sm">
            Seu personal ainda não ativou um protocolo. Avise para liberar seu
            treino.
          </p>
        </div>
      )}

      {data?.protocolo && !data.treino && (
        <div className="bg-bg-elevated border-border rounded-card border p-6 text-center">
          <p className="font-medium">Folga hoje</p>
          <p className="text-text-secondary mt-1 text-sm">
            Não há treino marcado para {hojeNome.toLowerCase()}. Aproveite o
            descanso.
          </p>
          <p className="text-text-tertiary mt-3 text-xs">
            {data.protocolo.nome}
          </p>
        </div>
      )}

      {data?.treino && (
        <section className="space-y-4">
          <div className="bg-bg-elevated border-border rounded-card border p-5">
            <p className="text-accent text-xs font-semibold uppercase tracking-wider">
              Treino {data.treino.letra}
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">
              {data.treino.nome}
            </h2>
            <p className="text-text-secondary mt-2 font-num text-xs tabular-nums">
              {data.treino.exercicios.length} exercícios ·{' '}
              {data.treino.exercicios.reduce((acc, ex) => acc + ex.series, 0)}{' '}
              séries no total
            </p>
          </div>

          <ul className="space-y-2">
            {data.treino.exercicios.map((ex, i) => (
              <li
                key={ex.id}
                data-stagger-item
                style={{ ['--stagger-index' as string]: Math.min(i, 12) }}
                className="bg-bg-elevated border-border rounded-card border p-3"
              >
                <div className="flex items-start gap-3">
                  <div className="bg-bg-subtle text-text-secondary font-num flex h-8 w-8 shrink-0 items-center justify-center rounded-chip text-xs font-semibold">
                    {i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {ex.exercicio.nome}
                    </p>
                    <p className="font-num text-text-secondary mt-0.5 text-xs tabular-nums">
                      {ex.series}×{ex.repsAlvo}
                      {ex.cargaSugeridaKg ? ` · ${ex.cargaSugeridaKg}kg` : ''} ·
                      descanso {ex.descansoSegundos}s
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      <Chip variant="neutral" size="sm">
                        {GRUPO_LABELS[ex.exercicio.grupoMuscularPrimario]}
                      </Chip>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {data?.treino && (
        <div
          className={cn(
            'fixed inset-x-0 bottom-16 z-20 px-4 pb-2',
            'mx-auto max-w-xl',
          )}
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0.5rem)' }}
        >
          {data.sessaoAtiva ? (
            <button
              type="button"
              onClick={() =>
                navigate({
                  to: '/treino/$sid',
                  params: { sid: data.sessaoAtiva!.id },
                })
              }
              className="bg-accent text-bg-base hover:bg-accent-hover active:bg-accent-pressed active:scale-[0.98] flex w-full items-center justify-center gap-2 rounded-pill py-4 text-base font-semibold shadow-lg shadow-black/40 transition"
            >
              <ChevronRight size={20} />
              Continuar treino
            </button>
          ) : (
            <button
              type="button"
              onClick={() => iniciar.mutate()}
              disabled={iniciar.isPending}
              className="bg-accent text-bg-base hover:bg-accent-hover active:bg-accent-pressed active:scale-[0.98] disabled:opacity-60 flex w-full items-center justify-center gap-2 rounded-pill py-4 text-base font-semibold shadow-lg shadow-black/40 transition"
            >
              <Play size={18} fill="currentColor" />
              {iniciar.isPending ? 'Iniciando…' : 'Começar treino'}
            </button>
          )}
        </div>
      )}
    </main>
  );
}
