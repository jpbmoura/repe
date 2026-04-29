import { Field, Select } from '@/components/field';
import { ApiError } from '@/lib/api';
import {
  DIVISAO_LABELS,
  protocolosApi,
  protocolosKeys,
} from '@/lib/api/protocolos';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  protocoloCreateSchema,
  type ProtocoloCreate,
} from '@repe/shared/schemas';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from './dialog';

type ProtocoloCreateInput = z.input<typeof protocoloCreateSchema>;

type Props = {
  alunoId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CriarProtocoloDialog({ alunoId, open, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  const form = useForm<ProtocoloCreateInput, unknown, ProtocoloCreate>({
    resolver: zodResolver(protocoloCreateSchema),
    defaultValues: {
      nome: '',
      dataInicio: today,
      divisao: 'ABC',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: ProtocoloCreate) => protocolosApi.criar(alunoId, data),
    onSuccess: ({ protocolo }) => {
      queryClient.invalidateQueries({
        queryKey: protocolosKeys.doAluno(alunoId),
      });
      onOpenChange(false);
      navigate({
        to: '/alunos/$id/protocolos/$pid',
        params: { id: alunoId, pid: protocolo.id },
      });
    },
    onError: (err) => {
      if (err instanceof ApiError && err.code === 'validation_error') {
        setServerError('Confira os campos.');
      } else {
        setServerError('Não foi possível criar o protocolo.');
      }
    },
  });

  const onSubmit = (values: ProtocoloCreate) => {
    setServerError(null);
    const payload: ProtocoloCreate = {
      nome: values.nome,
      dataInicio: values.dataInicio,
      divisao: values.divisao,
    };
    if (values.dataFim) payload.dataFim = values.dataFim;
    mutation.mutate(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <DialogTitle>Novo protocolo</DialogTitle>
            <DialogDescription>
              Cria como rascunho. Você ativa quando estiver pronto.
            </DialogDescription>
          </div>

          <Field
            label="Nome"
            placeholder="Ex.: Hipertrofia inverno 2026"
            autoComplete="off"
            {...form.register('nome')}
            error={form.formState.errors.nome?.message}
          />

          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Início"
              type="date"
              {...form.register('dataInicio')}
              error={form.formState.errors.dataInicio?.message}
            />
            <Field
              label="Fim (opcional)"
              type="date"
              {...form.register('dataFim')}
              error={form.formState.errors.dataFim?.message}
            />
          </div>

          <Select
            label="Divisão"
            {...form.register('divisao')}
            error={form.formState.errors.divisao?.message}
          >
            {Object.entries(DIVISAO_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </Select>

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
              {mutation.isPending ? 'Criando…' : 'Criar e abrir editor'}
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
