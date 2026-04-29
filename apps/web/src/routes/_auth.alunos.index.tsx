import { Avatar } from '@/components/avatar';
import { CriarAlunoDialog } from '@/components/criar-aluno-dialog';
import { Stats } from '@/components/stats';
import { StatusBadge, type StatusKind } from '@/components/status-badge';
import { alunosApi, alunosKeys, type AlunoListItem } from '@/lib/api/alunos';
import { dashboardApi, dashboardKeys } from '@/lib/api/dashboard';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';

export const Route = createFileRoute('/_auth/alunos/')({
  component: AlunosPage,
});

type Filtro = 'ativos' | 'inativos' | 'todos';

function saudacao(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Boa noite';
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

function AlunosPage() {
  const { user } = Route.useRouteContext();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filtro, setFiltro] = useState<Filtro>('ativos');

  const dashboardQuery = useQuery({
    queryKey: dashboardKeys.personal(),
    queryFn: () => dashboardApi.personal(),
  });

  const alunosQuery = useQuery({
    queryKey: alunosKeys.lista(),
    queryFn: () => alunosApi.listar(),
  });

  const alunosFiltrados = useMemo(() => {
    if (!alunosQuery.data) return [];
    const lista = alunosQuery.data.alunos;
    if (filtro === 'ativos') return lista.filter((a) => a.status === 'ativo');
    if (filtro === 'inativos') return lista.filter((a) => a.status === 'inativo');
    return lista;
  }, [alunosQuery.data, filtro]);

  return (
    <main className="mx-auto max-w-2xl px-4 pb-28 pt-6">
      <header className="mb-6 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-text-secondary text-sm">{saudacao()},</p>
          <h1 className="truncate text-2xl font-semibold">{user.nome}</h1>
        </div>
        <Avatar nome={user.nome} size="lg" variant="neutral" />
      </header>

      <Stats
        className="mb-6"
        items={[
          {
            label: 'Ativos',
            value: dashboardQuery.data?.ativos ?? '—',
          },
          {
            label: 'Hoje',
            value: dashboardQuery.data?.hojeEsperados ?? '—',
          },
          {
            label: 'PRs sem.',
            value: dashboardQuery.data?.prsSemana ?? '—',
            accent: 'success',
          },
        ]}
      />

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-text-secondary text-xs font-semibold uppercase tracking-wide">
            Meus alunos
          </h2>
          <FiltroSelect value={filtro} onChange={setFiltro} />
        </div>

        {alunosQuery.isPending && (
          <p className="text-text-secondary text-sm">Carregando…</p>
        )}

        {alunosFiltrados.length === 0 && alunosQuery.data && (
          <div className="bg-bg-elevated border-border rounded-card border p-6 text-center">
            <p className="text-text-secondary text-sm">
              {filtro === 'ativos'
                ? 'Nenhum aluno ativo ainda. Crie o primeiro abaixo.'
                : 'Nada por aqui.'}
            </p>
          </div>
        )}

        {alunosFiltrados.length > 0 && (
          <ul className="space-y-2">
            {alunosFiltrados.map((aluno, i) => (
              <AlunoCard key={aluno.id} aluno={aluno} index={i} />
            ))}
          </ul>
        )}
      </section>

      <button
        type="button"
        onClick={() => setDialogOpen(true)}
        className="bg-accent text-bg-base hover:bg-accent-hover active:bg-accent-pressed active:scale-95 fixed bottom-20 right-4 z-20 flex h-14 w-14 items-center justify-center rounded-full shadow-lg shadow-black/40 transition"
        aria-label="Criar aluno"
      >
        <Plus size={24} strokeWidth={2.5} />
      </button>

      <CriarAlunoDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </main>
  );
}

function FiltroSelect({
  value,
  onChange,
}: {
  value: Filtro;
  onChange: (v: Filtro) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as Filtro)}
      className="bg-bg-subtle border-border rounded-pill border px-3 py-1.5 text-xs font-medium outline-none"
    >
      <option value="ativos">Ativos</option>
      <option value="inativos">Inativos</option>
      <option value="todos">Todos</option>
    </select>
  );
}

function AlunoCard({ aluno, index }: { aluno: AlunoListItem; index: number }) {
  const cadastrado = Boolean(aluno.userId);

  let kind: StatusKind | null = null;
  if (aluno.status === 'inativo') kind = 'inativo';
  else if (!cadastrado) kind = 'pendente';
  else if (aluno.treinouHoje) kind = 'treinou';
  else if (aluno.emAtraso) kind = 'atraso';

  return (
    <li
      data-stagger-item
      style={{ ['--stagger-index' as string]: index }}
    >
      <Link
        to="/alunos/$id"
        params={{ id: aluno.id }}
        className="bg-bg-elevated border-border hover:border-border-strong active:scale-[0.99] flex items-center gap-3 rounded-card border p-3 transition"
      >
        <Avatar nome={aluno.nome} size="md" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{aluno.nome}</p>
          <p className="text-text-secondary truncate text-xs">{aluno.email}</p>
        </div>
        {kind && <StatusBadge status={kind} />}
      </Link>
    </li>
  );
}
