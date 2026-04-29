import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/dialog';
import {
  EQUIPAMENTO_LABELS,
  GRUPO_LABELS,
  exerciciosApi,
  exerciciosKeys,
  type Exercicio,
  type ExercicioFilters,
} from '@/lib/api/exercicios';
import { protocolosApi } from '@/lib/api/protocolos';
import type {
  Equipamento,
  GrupoMuscular,
} from '@repe/shared/schemas';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { useDeferredValue, useMemo, useState } from 'react';

type Props = {
  treinoId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded: () => void;
};

export function AdicionarExercicioSheet({
  treinoId,
  open,
  onOpenChange,
  onAdded,
}: Props) {
  const [busca, setBusca] = useState('');
  const buscaDeferida = useDeferredValue(busca);
  const [grupoMuscular, setGrupoMuscular] = useState<GrupoMuscular | ''>('');
  const [equipamento, setEquipamento] = useState<Equipamento | ''>('');

  const filters: ExercicioFilters = useMemo(
    () => ({
      ...(buscaDeferida.trim() && { busca: buscaDeferida.trim() }),
      ...(grupoMuscular && { grupoMuscular }),
      ...(equipamento && { equipamento }),
      escopo: 'todos',
    }),
    [buscaDeferida, grupoMuscular, equipamento],
  );

  const { data, isPending } = useQuery({
    queryKey: exerciciosKeys.lista(filters),
    queryFn: () => exerciciosApi.listar(filters),
    enabled: open,
  });

  const adicionar = useMutation({
    mutationFn: (exercicio: Exercicio) =>
      protocolosApi.adicionarExercicio(treinoId, {
        exercicioId: exercicio.id,
        series: 3,
        repsAlvo: '8-12',
        descansoSegundos: 60,
        tipoSerie: 'normal',
      }),
    onSuccess: () => {
      onAdded();
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <div className="space-y-3">
          <DialogTitle>Adicionar exercício</DialogTitle>

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
              autoFocus
              className="bg-bg-subtle border-border focus:border-accent w-full rounded-chip border py-3 pl-10 pr-3 outline-none transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <select
              value={grupoMuscular}
              onChange={(e) =>
                setGrupoMuscular(e.target.value as GrupoMuscular | '')
              }
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
              onChange={(e) =>
                setEquipamento(e.target.value as Equipamento | '')
              }
              className="bg-bg-subtle border-border rounded-chip border px-3 py-2 text-sm outline-none"
            >
              <option value="">Todos equips.</option>
              {Object.entries(EQUIPAMENTO_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 max-h-[55dvh] overflow-y-auto pr-1">
          {isPending && (
            <p className="text-text-secondary py-4 text-center text-sm">
              Carregando…
            </p>
          )}
          {data && data.exercicios.length === 0 && (
            <p className="text-text-secondary py-8 text-center text-sm">
              Nada encontrado.
            </p>
          )}
          {data && data.exercicios.length > 0 && (
            <ul className="space-y-2">
              {data.exercicios.map((ex) => (
                <li key={ex.id}>
                  <button
                    type="button"
                    disabled={adicionar.isPending}
                    onClick={() => adicionar.mutate(ex)}
                    className="bg-bg-subtle hover:bg-bg-base/40 border-border hover:border-border-strong w-full rounded-card border p-3 text-left transition disabled:opacity-60"
                  >
                    <p className="font-medium">{ex.nome}</p>
                    <p className="text-text-secondary mt-0.5 text-xs">
                      {GRUPO_LABELS[ex.grupoMuscularPrimario]} ·{' '}
                      {EQUIPAMENTO_LABELS[ex.equipamento]} · {ex.categoria}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
