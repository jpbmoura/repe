import { Avatar } from '@/components/avatar';
import { InstallPwaPrompt } from '@/components/install-pwa-prompt';
import { usePwaInstall } from '@/hooks/use-pwa-install';
import { signOut } from '@/lib/auth-client';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { CheckCircle2, Download, LogOut } from 'lucide-react';
import { useState } from 'react';

export const Route = createFileRoute('/_auth/perfil')({
  component: PerfilPage,
});

function PerfilPage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const { standalone, installable } = usePwaInstall();
  const [installOpen, setInstallOpen] = useState(false);

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

      <section className="bg-bg-elevated border-border mb-4 rounded-card border p-4">
        <h2 className="mb-3 font-medium">App</h2>
        {standalone ? (
          <div className="text-success flex items-center gap-2 text-sm">
            <CheckCircle2 size={16} />
            <span>App instalado nesse dispositivo.</span>
          </div>
        ) : installable ? (
          <button
            type="button"
            onClick={() => setInstallOpen(true)}
            className="bg-bg-subtle border-border hover:border-border-strong active:scale-[0.99] flex w-full items-center gap-3 rounded-card border p-3 text-left transition"
          >
            <div className="bg-accent/15 text-accent flex h-9 w-9 shrink-0 items-center justify-center rounded-chip">
              <Download size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Instalar como app</p>
              <p className="text-text-secondary text-xs">
                Abre direto, sem barra do navegador, e funciona offline.
              </p>
            </div>
          </button>
        ) : (
          <p className="text-text-secondary text-sm">
            Para instalar, abra esse link no Chrome (Android), Safari (iOS) ou
            Edge (Desktop).
          </p>
        )}
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

      <InstallPwaPrompt
        manualOpen={installOpen}
        onManualClose={() => setInstallOpen(false)}
      />
    </main>
  );
}
