import { createFileRoute } from '@tanstack/react-router';
import { BarChart3 } from 'lucide-react';

export const Route = createFileRoute('/_auth/metricas')({
  component: MetricasPage,
});

function MetricasPage() {
  const { user } = Route.useRouteContext();

  return (
    <main className="pb-nav mx-auto max-w-2xl px-4 pt-8">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold">Métricas</h1>
        <p className="text-text-secondary text-sm">
          {user.role === 'personal'
            ? 'Visão consolidada dos seus alunos.'
            : 'Sua evolução nos treinos.'}
        </p>
      </header>

      <section className="bg-bg-elevated border-border rounded-card border p-8 text-center">
        <BarChart3 size={32} className="text-text-tertiary mx-auto mb-3" />
        <p className="font-medium">Em breve</p>
        <p className="text-text-secondary mt-1 text-sm">
          {user.role === 'personal'
            ? 'PRs por aluno, tonelagem semanal, adesão ao protocolo.'
            : 'Histórico de cargas, PRs por exercício, consistência semanal.'}
        </p>
      </section>
    </main>
  );
}
