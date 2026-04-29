import { Field, Select, Textarea } from '@/components/field';
import { ApiError } from '@/lib/api';
import {
  EQUIPAMENTO_LABELS,
  GRUPO_LABELS,
  exerciciosApi,
  exerciciosKeys,
} from '@/lib/api/exercicios';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  exercicioCreateSchema,
  type ExercicioCreate,
} from '@repe/shared/schemas';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';

type ExercicioCreateInput = z.input<typeof exercicioCreateSchema>;
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from './dialog';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CriarExercicioDialog({ open, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<ExercicioCreateInput, unknown, ExercicioCreate>({
    resolver: zodResolver(exercicioCreateSchema),
    defaultValues: {
      nome: '',
      grupoMuscularPrimario: 'peito',
      gruposSecundarios: [],
      equipamento: 'barra',
      categoria: 'composto',
      youtubeUrl: '',
      instrucoes: '',
    },
  });

  const mutation = useMutation({
    mutationFn: exerciciosApi.criar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: exerciciosKeys.all });
      form.reset();
      onOpenChange(false);
    },
    onError: (err) => {
      if (err instanceof ApiError && err.code === 'validation_error') {
        setServerError('Confira os campos.');
      } else {
        setServerError('Não foi possível criar o exercício.');
      }
    },
  });

  const onSubmit = (values: ExercicioCreate) => {
    setServerError(null);
    const payload: ExercicioCreate = {
      nome: values.nome,
      grupoMuscularPrimario: values.grupoMuscularPrimario,
      gruposSecundarios: values.gruposSecundarios ?? [],
      equipamento: values.equipamento,
      categoria: values.categoria,
    };
    if (values.youtubeUrl?.trim()) payload.youtubeUrl = values.youtubeUrl.trim();
    if (values.instrucoes?.trim()) payload.instrucoes = values.instrucoes.trim();
    mutation.mutate(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <DialogTitle>Novo exercício</DialogTitle>
            <DialogDescription>
              Será adicionado à sua biblioteca privada.
            </DialogDescription>
          </div>

          <Field
            label="Nome"
            autoComplete="off"
            {...form.register('nome')}
            error={form.formState.errors.nome?.message}
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Grupo principal"
              {...form.register('grupoMuscularPrimario')}
              error={form.formState.errors.grupoMuscularPrimario?.message}
            >
              {Object.entries(GRUPO_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </Select>

            <Select
              label="Equipamento"
              {...form.register('equipamento')}
              error={form.formState.errors.equipamento?.message}
            >
              {Object.entries(EQUIPAMENTO_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </Select>
          </div>

          <Select
            label="Categoria"
            {...form.register('categoria')}
            error={form.formState.errors.categoria?.message}
          >
            <option value="composto">Composto</option>
            <option value="isolado">Isolado</option>
          </Select>

          <Field
            label="URL do YouTube (opcional)"
            type="url"
            placeholder="https://youtube.com/watch?v=..."
            {...form.register('youtubeUrl')}
            error={form.formState.errors.youtubeUrl?.message}
          />

          <Textarea
            label="Instruções (opcional)"
            rows={3}
            {...form.register('instrucoes')}
            error={form.formState.errors.instrucoes?.message}
          />

          {serverError && (
            <p className="text-danger text-sm" role="alert">
              {serverError}
            </p>
          )}

          <div className="flex flex-col gap-2 pt-2 sm:flex-row-reverse">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="bg-accent text-bg-base hover:bg-accent-hover active:bg-accent-pressed disabled:opacity-60 flex-1 rounded-pill px-4 py-3 font-medium transition"
            >
              {mutation.isPending ? 'Criando…' : 'Criar exercício'}
            </button>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="bg-bg-subtle border-border flex-1 rounded-pill border px-4 py-3 text-sm font-medium"
            >
              Cancelar
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
