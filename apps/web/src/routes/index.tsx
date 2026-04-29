import { ensureSession } from '@/lib/session';
import { Logo } from '@repe/ui';
import { createFileRoute, Link, redirect } from '@tanstack/react-router';
import { ChevronRight, Dumbbell, GraduationCap } from 'lucide-react';

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    const session = await ensureSession();
    if (session?.user) {
      const role = (session.user as { role?: string }).role;
      throw redirect({ to: role === 'aluno' ? '/hoje' : '/alunos' });
    }
  },
  component: WelcomePage,
});

function WelcomePage() {
  return (
    <main className="mx-auto flex min-h-safe max-w-md flex-col px-6 py-12">
      <header className="mb-12 mt-6">
        <Logo variant="dark" className="mb-6 h-12" />
        <h1 className="text-3xl font-semibold tracking-tight">
          Bem-vindo ao Repê
        </h1>
        <p className="text-text-secondary mt-2 text-sm">
          Treino sério, sem planilha de Excel.
        </p>
      </header>

      <section className="space-y-3">
        <p className="text-text-secondary text-xs font-semibold uppercase tracking-wider">
          Quem é você?
        </p>

        <RoleCard
          to="/login"
          search={{ role: 'personal' as const }}
          icon={<GraduationCap size={22} />}
          title="Sou personal trainer"
          subtitle="Crio protocolos e acompanho meus alunos."
        />

        <RoleCard
          to="/login"
          search={{ role: 'aluno' as const }}
          icon={<Dumbbell size={22} />}
          title="Sou aluno"
          subtitle="Recebo o treino do meu personal e executo."
        />
      </section>
    </main>
  );
}

function RoleCard({
  to,
  search,
  icon,
  title,
  subtitle,
}: {
  to: string;
  search: { role: 'personal' | 'aluno' };
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <Link
      to={to}
      search={search}
      className="bg-bg-elevated border-border hover:border-accent active:scale-[0.99] group flex items-center gap-4 rounded-card border p-4 transition"
    >
      <div className="bg-bg-subtle text-accent group-hover:bg-accent/15 flex h-12 w-12 shrink-0 items-center justify-center rounded-card transition">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{title}</p>
        <p className="text-text-secondary mt-0.5 text-xs">{subtitle}</p>
      </div>
      <ChevronRight size={18} className="text-text-tertiary shrink-0" />
    </Link>
  );
}
