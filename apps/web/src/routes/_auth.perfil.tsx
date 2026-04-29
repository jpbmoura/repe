import { Avatar } from '@/components/avatar';
import { signOut } from '@/lib/auth-client';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { LogOut } from 'lucide-react';

export const Route = createFileRoute('/_auth/perfil')({
  component: PerfilPage,
});

function PerfilPage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate({ to: '/login' });
  };

  return (
    <main className="pb-nav mx-auto max-w-2xl px-4 pt-8">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold">Perfil</h1>
      </header>

      <section className="bg-bg-elevated border-border mb-4 flex items-center gap-4 rounded-card border p-4">
        <Avatar nome={user.nome} size="lg" />
        <div className="min-w-0">
          <p className="truncate font-semibold">{user.nome}</p>
          <p className="text-text-secondary truncate text-sm">{user.email}</p>
          <p className="text-text-tertiary mt-0.5 text-xs uppercase tracking-wide">
            {user.role === 'personal' ? 'Personal trainer' : 'Aluno'}
          </p>
        </div>
      </section>

      <section className="bg-bg-elevated border-border rounded-card border p-4">
        <h2 className="mb-2 font-medium">Em breve</h2>
        <p className="text-text-secondary text-sm">
          Editar nome, foto, alterar senha e preferências de notificação.
        </p>
      </section>

      <button
        type="button"
        onClick={handleLogout}
        className="text-danger mt-6 inline-flex items-center gap-2 text-sm"
      >
        <LogOut size={14} />
        Sair da conta
      </button>
    </main>
  );
}
