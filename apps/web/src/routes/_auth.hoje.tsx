import { sessoesApi, sessoesKeys } from '@/lib/api/sessoes';
import { authClient } from '@/lib/auth-client';
import { GRUPO_LABELS } from '@/lib/api/exercicios';
import { Logo } from '@repe/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { ChevronRight, Dumbbell, History, Play } from 'lucide-react';

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

  const handleLogout = async () => {
    await authClient.signOut();
    navigate({ to: '/login' });
  };

  const hojeNome = NOMES_DIA[new Date().getDay()] ?? 'Olá';

  if (isPending) {
    return (
      <main className="mx-auto max-w-xl px-4 py-8">
        <p className="text-text-secondary text-sm">Carregando…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-8 pb-12">
      <nav className="mb-6 flex items-center justify-between">
        <Logo variant="dark" className="h-7" />
        <div className="flex items-center gap-3">
          <Link
            to="/historico"
            className="text-text-secondary hover:text-text-primary"
            aria-label="Histórico"
          >
            <History size={18} />
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="text-text-secondary hover:text-text-primary text-sm"
          >
            Sair
          </button>
        </div>
      </nav>
      <header className="mb-6">
        <p className="text-text-secondary text-sm">{hojeNome}, olá</p>
        <h1 className="text-2xl font-semibold">{user.nome}</h1>
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
            Protocolo: {data.protocolo.nome}
          </p>
        </div>
      )}

      {data?.treino && (
        <section className="space-y-4">
          <div className="bg-bg-elevated border-border rounded-card border p-5">
            <p className="text-text-secondary text-xs uppercase tracking-wide">
              Treino de hoje
            </p>
            <h2 className="text-xl font-semibold">
              {data.treino.letra} · {data.treino.nome}
            </h2>
            <p className="text-text-secondary mt-2 text-sm">
              {data.treino.exercicios.length} exercícios
            </p>
          </div>

          <ul className="space-y-2">
            {data.treino.exercicios.map((ex) => (
              <li
                key={ex.id}
                className="bg-bg-elevated border-border rounded-card border p-3"
              >
                <p className="font-medium">{ex.exercicio.nome}</p>
                <p className="text-text-secondary mt-0.5 text-xs">
                  <span className="font-num">
                    {ex.series}x{ex.repsAlvo}
                  </span>
                  {' · '}
                  {GRUPO_LABELS[ex.exercicio.grupoMuscularPrimario]}
                  {' · '}
                  descanso{' '}
                  <span className="font-num">{ex.descansoSegundos}s</span>
                </p>
              </li>
            ))}
          </ul>

          <div className="sticky bottom-3 mt-4">
            {data.sessaoAtiva ? (
              <button
                type="button"
                onClick={() =>
                  navigate({
                    to: '/treino/$sid',
                    params: { sid: data.sessaoAtiva!.id },
                  })
                }
                className="bg-accent text-bg-base hover:bg-accent-hover active:bg-accent-pressed flex w-full items-center justify-center gap-2 rounded-pill py-4 text-base font-semibold transition"
              >
                <ChevronRight size={20} />
                Continuar treino
              </button>
            ) : (
              <button
                type="button"
                onClick={() => iniciar.mutate()}
                disabled={iniciar.isPending}
                className="bg-accent text-bg-base hover:bg-accent-hover active:bg-accent-pressed disabled:opacity-60 flex w-full items-center justify-center gap-2 rounded-pill py-4 text-base font-semibold transition"
              >
                <Play size={20} fill="currentColor" />
                {iniciar.isPending ? 'Iniciando…' : 'Começar treino'}
              </button>
            )}
          </div>
        </section>
      )}
    </main>
  );
}
