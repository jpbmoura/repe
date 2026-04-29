import { sessoesApi, sessoesKeys } from '@/lib/api/sessoes';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_auth/historico')({
  component: HistoricoPage,
});

function formatarData(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  });
}

function duracaoMinutos(inicio: string, fim: string | null): number | null {
  if (!fim) return null;
  return Math.round(
    (new Date(fim).getTime() - new Date(inicio).getTime()) / 60000,
  );
}

function HistoricoPage() {
  const { data, isPending } = useQuery({
    queryKey: sessoesKeys.historico(),
    queryFn: () => sessoesApi.historico({ limit: 30 }),
  });

  return (
    <main className="pb-nav mx-auto max-w-2xl px-4 pt-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Histórico</h1>
        <p className="text-text-secondary text-sm">
          {data ? `${data.sessoes.length} sessões` : 'Carregando…'}
        </p>
      </header>

      {isPending && <p className="text-text-secondary text-sm">Carregando…</p>}

      {data && data.sessoes.length === 0 && (
        <div className="bg-bg-elevated border-border rounded-card border p-6 text-center">
          <p className="text-text-secondary text-sm">
            Sem sessões registradas ainda.
          </p>
        </div>
      )}

      {data && data.sessoes.length > 0 && (
        <ul className="space-y-3">
          {data.sessoes.map((sessao, i) => {
            const tonelagem = sessao.series.reduce(
              (acc, s) => acc + Number(s.cargaKg) * s.repsFeitas,
              0,
            );
            const duracao = duracaoMinutos(sessao.horaInicio, sessao.horaFim);
            const finalizado = Boolean(sessao.horaFim);

            return (
              <li
                key={sessao.id}
                data-stagger-item
                style={{ ['--stagger-index' as string]: Math.min(i, 12) }}
                className="bg-bg-elevated border-border rounded-card border p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-text-secondary text-xs uppercase tracking-wide">
                      {formatarData(sessao.data)}
                    </p>
                    <p className="font-medium">
                      {sessao.treino.letra} · {sessao.treino.nome}
                    </p>
                  </div>
                  {!finalizado && (
                    <span className="bg-warn/15 text-warn shrink-0 rounded-pill px-2 py-0.5 text-xs">
                      em andamento
                    </span>
                  )}
                </div>

                <div className="text-text-secondary mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                  <span>
                    <span className="font-num text-text-primary">
                      {sessao.series.length}
                    </span>{' '}
                    séries
                  </span>
                  {tonelagem > 0 && (
                    <span>
                      Tonelagem{' '}
                      <span className="font-num text-text-primary">
                        {Math.round(tonelagem).toLocaleString('pt-BR')} kg
                      </span>
                    </span>
                  )}
                  {duracao !== null && (
                    <span>
                      Duração{' '}
                      <span className="font-num text-text-primary">
                        {duracao} min
                      </span>
                    </span>
                  )}
                </div>

                {sessao.observacaoAluno && (
                  <p className="text-text-secondary mt-3 text-sm whitespace-pre-wrap">
                    {sessao.observacaoAluno}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
