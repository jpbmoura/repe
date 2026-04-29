import { zodResolver } from '@hookform/resolvers/zod';
import { alunoCreateSchema, type AlunoCreate } from '@repe/shared/schemas';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { ApiError } from '@/lib/api';
import { alunosApi, alunosKeys, type AlunoDetalhe } from '@/lib/api/alunos';

type AlunoCreateInput = z.input<typeof alunoCreateSchema>;
import { CodigoConvite } from './codigo-convite';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from './dialog';
import { Field, Select, Textarea } from './field';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CriarAlunoDialog({ open, onOpenChange }: Props) {
  const [codigoCriado, setCodigoCriado] = useState<{
    codigo: string;
    aluno: AlunoDetalhe;
  } | null>(null);

  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<AlunoCreateInput, unknown, AlunoCreate>({
    resolver: zodResolver(alunoCreateSchema),
    defaultValues: {
      nome: '',
      email: '',
      objetivo: '',
      observacoes: '',
    },
  });

  const mutation = useMutation({
    mutationFn: alunosApi.criar,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: alunosKeys.lista() });
      setCodigoCriado({ codigo: data.codigo, aluno: data.aluno });
      form.reset();
    },
    onError: (err) => {
      if (err instanceof ApiError && err.code === 'validation_error') {
        setServerError('Confira os campos.');
      } else {
        setServerError('Não foi possível criar o aluno. Tente novamente.');
      }
    },
  });

  const handleClose = (next: boolean) => {
    if (!next) {
      setCodigoCriado(null);
      setServerError(null);
      form.reset();
    }
    onOpenChange(next);
  };

  const onSubmit = (values: AlunoCreate) => {
    setServerError(null);
    const payload: AlunoCreate = {
      nome: values.nome,
      email: values.email,
    };
    if (values.dataNascimento) payload.dataNascimento = values.dataNascimento;
    if (values.sexo) payload.sexo = values.sexo;
    if (values.objetivo?.trim()) payload.objetivo = values.objetivo.trim();
    if (values.observacoes?.trim()) payload.observacoes = values.observacoes.trim();
    mutation.mutate(payload);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        {codigoCriado ? (
          <div className="space-y-4">
            <div>
              <DialogTitle>Aluno criado</DialogTitle>
              <DialogDescription>
                Compartilhe o código com {codigoCriado.aluno.nome.split(' ')[0]} para
                ele criar a conta.
              </DialogDescription>
            </div>
            <CodigoConvite
              codigo={codigoCriado.codigo}
              nomeAluno={codigoCriado.aluno.nome}
            />
            <button
              type="button"
              onClick={() => handleClose(false)}
              className="bg-bg-subtle border-border w-full rounded-pill border px-4 py-3 text-sm font-medium"
            >
              Concluído
            </button>
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <DialogTitle>Novo aluno</DialogTitle>
              <DialogDescription>
                Você gera um código que o aluno usa para criar a conta.
              </DialogDescription>
            </div>

            <Field
              label="Nome"
              autoComplete="off"
              {...form.register('nome')}
              error={form.formState.errors.nome?.message}
            />
            <Field
              label="E-mail"
              type="email"
              autoComplete="off"
              {...form.register('email')}
              error={form.formState.errors.email?.message}
            />
            <Field
              label="Data de nascimento (opcional)"
              type="date"
              {...form.register('dataNascimento')}
              error={form.formState.errors.dataNascimento?.message}
            />
            <Select
              label="Sexo (opcional)"
              {...form.register('sexo')}
              error={form.formState.errors.sexo?.message}
            >
              <option value="">—</option>
              <option value="M">Masculino</option>
              <option value="F">Feminino</option>
              <option value="outro">Outro</option>
            </Select>
            <Textarea
              label="Objetivo (opcional)"
              rows={2}
              {...form.register('objetivo')}
              error={form.formState.errors.objetivo?.message}
            />
            <Textarea
              label="Observações (opcional)"
              rows={2}
              {...form.register('observacoes')}
              error={form.formState.errors.observacoes?.message}
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
                {mutation.isPending ? 'Criando…' : 'Criar e gerar código'}
              </button>
              <button
                type="button"
                onClick={() => handleClose(false)}
                className="bg-bg-subtle border-border flex-1 rounded-pill border px-4 py-3 text-sm font-medium"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
