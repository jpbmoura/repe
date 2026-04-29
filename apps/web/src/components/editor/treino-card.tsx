import { Field } from '@/components/field';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import {
  protocolosApi,
  protocolosKeys,
  type Treino,
} from '@/lib/api/protocolos';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { AdicionarExercicioSheet } from './adicionar-exercicio-sheet';
import { DiasSemana } from './dias-semana';
import { ExercicioRow } from './exercicio-row';

type Props = {
  treino: Treino;
  protocoloId: string;
  bloqueado: boolean;
};

export function TreinoCard({ treino, protocoloId, bloqueado }: Props) {
  const queryClient = useQueryClient();
  const [nome, setNome] = useState(treino.nome);
  const [diasSemana, setDiasSemana] = useState(treino.diasSemana);
  const [sheetOpen, setSheetOpen] = useState(false);

  const isFirstSync = useRef(true);

  useEffect(() => {
    setNome(treino.nome);
    setDiasSemana(treino.diasSemana);
    isFirstSync.current = true;
  }, [treino.id]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: protocolosKeys.detalhe(protocoloId) });
    queryClient.invalidateQueries({ queryKey: protocolosKeys.volume(protocoloId) });
  };

  const update = useMutation({
    mutationFn: (data: { nome?: string; diasSemana?: number[] }) =>
      protocolosApi.atualizarTreino(treino.id, data),
    onSuccess: invalidate,
  });

  const removerTreino = useMutation({
    mutationFn: () => protocolosApi.removerTreino(treino.id),
    onSuccess: invalidate,
  });

  const sendNomeUpdate = useDebouncedCallback((novoNome: string) => {
    update.mutate({ nome: novoNome });
  }, 800);

  const handleNomeChange = (v: string) => {
    setNome(v);
    sendNomeUpdate(v);
  };

  const handleDiasChange = (dias: number[]) => {
    setDiasSemana(dias);
    update.mutate({ diasSemana: dias });
  };

  return (
    <section className="space-y-4">
      <div className="bg-bg-elevated border-border rounded-card border p-4">
        <div className="mb-3 flex items-start gap-3">
          <div className="bg-bg-subtle flex h-10 w-10 shrink-0 items-center justify-center rounded-chip text-lg font-semibold">
            {treino.letra}
          </div>
          <div className="flex-1">
            <Field
              label="Nome do treino"
              value={nome}
              onChange={(e) => handleNomeChange(e.target.value)}
              disabled={bloqueado}
            />
          </div>
        </div>

        <div>
          <p className="text-text-secondary mb-2 text-sm">Dias da semana</p>
          <DiasSemana value={diasSemana} onChange={handleDiasChange} />
        </div>

        <div className="border-border mt-4 flex items-center justify-between border-t pt-3">
          <span className="text-text-secondary text-xs">
            {treino.exercicios.length} exercício
            {treino.exercicios.length === 1 ? '' : 's'}
          </span>
          <button
            type="button"
            onClick={() => removerTreino.mutate()}
            disabled={bloqueado || removerTreino.isPending}
            className="text-text-tertiary hover:text-danger inline-flex items-center gap-1 text-xs transition disabled:opacity-40"
          >
            <Trash2 size={12} />
            Remover treino
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {treino.exercicios.map((ex) => (
          <ExercicioRow
            key={ex.id}
            exercicio={ex}
            onRemoved={invalidate}
            onChanged={invalidate}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={() => setSheetOpen(true)}
        disabled={bloqueado}
        className="bg-bg-subtle border-border hover:border-accent inline-flex w-full items-center justify-center gap-2 rounded-card border border-dashed py-4 text-sm font-medium transition disabled:opacity-40"
      >
        <Plus size={16} />
        Adicionar exercício
      </button>

      <AdicionarExercicioSheet
        treinoId={treino.id}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onAdded={() => {
          invalidate();
          setSheetOpen(false);
        }}
      />
    </section>
  );
}
