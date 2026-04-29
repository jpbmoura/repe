import { CodigoConvite } from '@/components/codigo-convite';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/dialog';
import { alunosApi, alunosKeys } from '@/lib/api/alunos';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, RefreshCw } from 'lucide-react';
import { useState } from 'react';

type Props = {
  alunoId: string;
  alunoNome: string;
  codigoInicial: string | null;
  cadastrado: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CompartilharConviteDialog({
  alunoId,
  alunoNome,
  codigoInicial,
  cadastrado,
  open,
  onOpenChange,
}: Props) {
  const queryClient = useQueryClient();
  const [codigoOverride, setCodigoOverride] = useState<string | null>(null);

  const codigoAtual = codigoOverride ?? codigoInicial;

  const regenerar = useMutation({
    mutationFn: () => alunosApi.regenerarCodigo(alunoId),
    onSuccess: (response) => {
      setCodigoOverride(response.codigo);
      queryClient.invalidateQueries({ queryKey: alunosKeys.detalhe(alunoId) });
      queryClient.invalidateQueries({ queryKey: alunosKeys.lista() });
    },
  });

  const handleClose = (next: boolean) => {
    if (!next) setCodigoOverride(null);
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <div className="space-y-4">
          <div>
            <DialogTitle>Convite de acesso</DialogTitle>
            <DialogDescription>
              {cadastrado
                ? `${alunoNome.split(' ')[0]} já criou conta e está usando o app.`
                : `Compartilhe com ${alunoNome.split(' ')[0]} para criar a conta.`}
            </DialogDescription>
          </div>

          {cadastrado ? (
            <div className="bg-success/10 border-success/30 flex items-start gap-3 rounded-card border p-4">
              <CheckCircle2
                size={20}
                className="text-success mt-0.5 shrink-0"
                aria-hidden
              />
              <div className="text-sm">
                <p className="text-success font-medium">Acesso ativo</p>
                <p className="text-text-secondary mt-1">
                  Se ele perdeu o acesso, peça que use a opção “Entrar” no app
                  com o e-mail e senha cadastrados.
                </p>
              </div>
            </div>
          ) : codigoAtual ? (
            <CodigoConvite codigo={codigoAtual} nomeAluno={alunoNome} />
          ) : (
            <div className="bg-bg-subtle border-border rounded-card border p-4 text-center">
              <p className="text-text-secondary text-sm">
                Este aluno não tem código de convite ativo.
              </p>
            </div>
          )}

          {!cadastrado && (
            <button
              type="button"
              onClick={() => regenerar.mutate()}
              disabled={regenerar.isPending}
              className="text-text-secondary hover:text-text-primary inline-flex items-center gap-2 text-sm transition disabled:opacity-50"
            >
              <RefreshCw
                size={14}
                className={regenerar.isPending ? 'animate-spin' : ''}
              />
              {regenerar.isPending ? 'Gerando…' : 'Gerar novo código'}
            </button>
          )}

          <button
            type="button"
            onClick={() => handleClose(false)}
            className="bg-bg-subtle border-border w-full rounded-pill border px-4 py-3 text-sm font-medium"
          >
            Fechar
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
