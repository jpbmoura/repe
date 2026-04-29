import { CriarExercicioDialog } from '@/components/criar-exercicio-dialog';
import {
  EQUIPAMENTO_LABELS,
  GRUPO_LABELS,
  exerciciosApi,
  exerciciosKeys,
  type ExercicioFilters,
} from '@/lib/api/exercicios';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { ChevronLeft, Plus, Search } from 'lucide-react';
import { useDeferredValue, useMemo, useState } from 'react';
import type {
  EscopoBusca,
  Equipamento,
  GrupoMuscular,
} from '@repe/shared/schemas';

export const Route = createFileRoute('/_auth/biblioteca')({
  component: BibliotecaPage,
});

function BibliotecaPage() {
  const [busca, setBusca] = useState('');
  const buscaDeferida = useDeferredValue(busca);
  const [grupoMuscular, setGrupoMuscular] = useState<GrupoMuscular | ''>('');
  const [equipamento, setEquipamento] = useState<Equipamento | ''>('');
  const [escopo, setEscopo] = useState<EscopoBusca>('todos');
  const [dialogOpen, setDialogOpen] = useState(false);

  const filters: ExercicioFilters = useMemo(
    () => ({
      ...(buscaDeferida.trim() && { busca: buscaDeferida.trim() }),
      ...(grupoMuscular && { grupoMuscular }),
      ...(equipamento && { equipamento }),
      escopo,
    }),
    [buscaDeferida, grupoMuscular, equipamento, escopo],
  );

  const { data, isPending } = useQuery({
    queryKey: exerciciosKeys.lista(filters),
    queryFn: () => exerciciosApi.listar(filters),
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 pb-28">
      <Link
        to="/alunos"
        className="text-text-secondary hover:text-text-primary mb-4 inline-flex items-center gap-1 text-sm"
      >
        <ChevronLeft size={16} />
        Voltar
      </Link>

      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Biblioteca de exercícios</h1>
        <p className="text-text-secondary text-sm">
          Use para montar protocolos. Crie exercícios privados se precisar.
        </p>
      </header>

      <div className="space-y-3">
        <div className="relative">
          <Search
            size={16}
            className="text-text-secondary absolute left-3 top-1/2 -translate-y-1/2"
          />
          <input
            type="search"
            placeholder="Buscar pelo nome…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="bg-bg-subtle border-border focus:border-accent w-full rounded-chip border py-3 pl-10 pr-3 outline-none transition"
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <select
            value={grupoMuscular}
            onChange={(e) => setGrupoMuscular(e.target.value as GrupoMuscular | '')}
            className="bg-bg-subtle border-border rounded-chip border px-3 py-2 text-sm outline-none"
          >
            <option value="">Todos grupos</option>
            {Object.entries(GRUPO_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>

          <select
            value={equipamento}
            onChange={(e) => setEquipamento(e.target.value as Equipamento | '')}
            className="bg-bg-subtle border-border rounded-chip border px-3 py-2 text-sm outline-none"
          >
            <option value="">Todos equips.</option>
            {Object.entries(EQUIPAMENTO_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>

          <select
            value={escopo}
            onChange={(e) => setEscopo(e.target.value as EscopoBusca)}
            className="bg-bg-subtle border-border rounded-chip border px-3 py-2 text-sm outline-none"
          >
            <option value="todos">Todos</option>
            <option value="publico">Públicos</option>
            <option value="privado">Privados</option>
          </select>
        </div>
      </div>

      <section className="mt-6">
        {isPending && <p className="text-text-secondary text-sm">Carregando…</p>}

        {data && data.exercicios.length === 0 && (
          <div className="bg-bg-elevated border-border rounded-card border p-6 text-center">
            <p className="text-text-secondary text-sm">Nada encontrado.</p>
          </div>
        )}

        {data && data.exercicios.length > 0 && (
          <ul className="space-y-2">
            {data.exercicios.map((ex) => (
              <li
                key={ex.id}
                className="bg-bg-elevated border-border rounded-card border p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium">{ex.nome}</p>
                    <p className="text-text-secondary mt-0.5 text-xs">
                      {GRUPO_LABELS[ex.grupoMuscularPrimario]} ·{' '}
                      {EQUIPAMENTO_LABELS[ex.equipamento]} · {ex.categoria}
                    </p>
                  </div>
                  {ex.escopo === 'privado' && (
                    <span className="bg-accent/15 text-accent shrink-0 rounded-pill px-2 py-0.5 text-xs">
                      privado
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <button
        type="button"
        onClick={() => setDialogOpen(true)}
        className="bg-accent text-bg-base hover:bg-accent-hover active:bg-accent-pressed fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition"
        aria-label="Criar exercício"
      >
        <Plus size={24} />
      </button>

      <CriarExercicioDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </main>
  );
}
