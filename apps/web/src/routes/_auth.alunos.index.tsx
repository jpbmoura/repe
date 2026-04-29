import { CriarAlunoDialog } from '@/components/criar-aluno-dialog';
import { alunosApi, alunosKeys, type AlunoListItem } from '@/lib/api/alunos';
import { authClient } from '@/lib/auth-client';
import { Logo } from '@repe/ui';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { Plus } from 'lucide-react';
import { useState } from 'react';

export const Route = createFileRoute('/_auth/alunos/')({
  component: AlunosPage,
});

function AlunosPage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data, isPending, error } = useQuery({
    queryKey: alunosKeys.lista(),
    queryFn: () => alunosApi.listar(),
  });

  const handleLogout = async () => {
    await authClient.signOut();
    navigate({ to: '/login' });
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 pb-28">
      <nav className="mb-6 flex items-center justify-between">
        <Logo variant="dark" className="h-7" />
        <div className="flex items-center gap-4">
          <Link
            to="/biblioteca"
            className="text-text-secondary hover:text-text-primary text-sm"
          >
            Biblioteca
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
      <header className="mb-8">
        <p className="text-text-secondary text-sm">Olá,</p>
        <h1 className="text-2xl font-semibold">{user.nome}</h1>
      </header>

      <section>
        <h2 className="mb-4 text-lg font-medium">Seus alunos</h2>

        {isPending && (
          <p className="text-text-secondary text-sm">Carregando…</p>
        )}

        {error && (
          <p className="text-danger text-sm">Erro ao carregar alunos.</p>
        )}

        {data && data.alunos.length === 0 && (
          <div className="bg-bg-elevated border-border rounded-card border p-6 text-center">
            <p className="text-text-secondary text-sm">
              Nenhum aluno ainda. Crie seu primeiro abaixo.
            </p>
          </div>
        )}

        {data && data.alunos.length > 0 && (
          <ul className="space-y-2">
            {data.alunos.map((aluno) => (
              <AlunoRow key={aluno.id} aluno={aluno} />
            ))}
          </ul>
        )}
      </section>

      <button
        type="button"
        onClick={() => setDialogOpen(true)}
        className="bg-accent text-bg-base hover:bg-accent-hover active:bg-accent-pressed fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition"
        aria-label="Criar aluno"
      >
        <Plus size={24} />
      </button>

      <CriarAlunoDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </main>
  );
}

function AlunoRow({ aluno }: { aluno: AlunoListItem }) {
  const cadastrado = Boolean(aluno.userId);
  const status = aluno.status === 'inativo' ? 'inativo' : cadastrado ? 'ativo' : 'pendente';

  return (
    <li>
      <Link
        to="/alunos/$id"
        params={{ id: aluno.id }}
        className="bg-bg-elevated border-border hover:border-border-strong flex items-center justify-between rounded-card border p-4 transition"
      >
        <div className="min-w-0">
          <p className="truncate font-medium">{aluno.nome}</p>
          <p className="text-text-secondary truncate text-xs">{aluno.email}</p>
        </div>
        <StatusBadge status={status} />
      </Link>
    </li>
  );
}

function StatusBadge({ status }: { status: 'ativo' | 'pendente' | 'inativo' }) {
  const map = {
    ativo: { label: 'ativo', className: 'bg-success/15 text-success' },
    pendente: { label: 'aguardando', className: 'bg-warn/15 text-warn' },
    inativo: { label: 'inativo', className: 'bg-bg-subtle text-text-tertiary' },
  } as const;
  const { label, className } = map[status];
  return (
    <span
      className={`shrink-0 rounded-pill px-3 py-1 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}
