import { CodigoConvite } from '@/components/codigo-convite';
import { CriarProtocoloDialog } from '@/components/criar-protocolo-dialog';
import { alunosApi, alunosKeys } from '@/lib/api/alunos';
import {
  protocolosApi,
  protocolosKeys,
  STATUS_LABELS,
  type Protocolo,
} from '@/lib/api/protocolos';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { ChevronLeft, Plus, RefreshCw } from 'lucide-react';
import { useState } from 'react';

export const Route = createFileRoute('/_auth/alunos/$id/')({
  component: AlunoDetalhePage,
});

function AlunoDetalhePage() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const [codigoOverride, setCodigoOverride] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data, isPending, error } = useQuery({
    queryKey: alunosKeys.detalhe(id),
    queryFn: () => alunosApi.detalhe(id),
  });

  const protocolosQuery = useQuery({
    queryKey: protocolosKeys.doAluno(id),
    queryFn: () => protocolosApi.listar(id),
  });

  const regenerar = useMutation({
    mutationFn: () => alunosApi.regenerarCodigo(id),
    onSuccess: (response) => {
      setCodigoOverride(response.codigo);
      queryClient.invalidateQueries({ queryKey: alunosKeys.detalhe(id) });
      queryClient.invalidateQueries({ queryKey: alunosKeys.lista() });
    },
  });

  if (isPending) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-text-secondary text-sm">Carregando…</p>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-danger text-sm">Aluno não encontrado.</p>
        <Link to="/alunos" className="text-accent mt-4 inline-block text-sm">
          Voltar
        </Link>
      </main>
    );
  }

  const { aluno } = data;
  const codigoAtual = codigoOverride ?? aluno.convite?.codigo ?? null;
  const cadastrado = Boolean(aluno.userId);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 pb-28">
      <Link
        to="/alunos"
        className="text-text-secondary hover:text-text-primary mb-4 inline-flex items-center gap-1 text-sm"
      >
        <ChevronLeft size={16} />
        Voltar
      </Link>

      <header className="mb-6">
        <h1 className="text-2xl font-semibold">{aluno.nome}</h1>
        <p className="text-text-secondary text-sm">{aluno.email}</p>
      </header>

      {!cadastrado && codigoAtual && (
        <section className="mb-6">
          <CodigoConvite codigo={codigoAtual} nomeAluno={aluno.nome} />
          <button
            type="button"
            onClick={() => regenerar.mutate()}
            disabled={regenerar.isPending}
            className="text-text-secondary hover:text-text-primary mt-3 inline-flex items-center gap-2 text-sm"
          >
            <RefreshCw size={14} />
            {regenerar.isPending ? 'Gerando novo…' : 'Gerar novo código'}
          </button>
        </section>
      )}

      {cadastrado && (
        <section className="bg-bg-elevated border-border mb-6 rounded-card border p-4">
          <p className="text-success text-sm font-medium">Aluno cadastrado</p>
          <p className="text-text-secondary mt-1 text-xs">
            O aluno já criou conta e está acessando o app.
          </p>
        </section>
      )}

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium">Protocolos</h2>
          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            className="bg-accent text-bg-base hover:bg-accent-hover inline-flex items-center gap-1 rounded-pill px-3 py-1.5 text-sm font-medium transition"
          >
            <Plus size={14} />
            Novo
          </button>
        </div>

        {protocolosQuery.isPending && (
          <p className="text-text-secondary text-sm">Carregando…</p>
        )}

        {protocolosQuery.data && protocolosQuery.data.protocolos.length === 0 && (
          <div className="bg-bg-elevated border-border rounded-card border p-6 text-center">
            <p className="text-text-secondary text-sm">
              Sem protocolos. Crie o primeiro.
            </p>
          </div>
        )}

        {protocolosQuery.data && protocolosQuery.data.protocolos.length > 0 && (
          <ul className="space-y-2">
            {protocolosQuery.data.protocolos.map((protocolo) => (
              <ProtocoloRow key={protocolo.id} alunoId={id} protocolo={protocolo} />
            ))}
          </ul>
        )}
      </section>

      {(aluno.objetivo || aluno.observacoes) && (
        <section className="bg-bg-elevated border-border mt-6 space-y-3 rounded-card border p-4">
          {aluno.objetivo && (
            <div>
              <h3 className="text-text-secondary mb-1 text-xs font-medium uppercase tracking-wide">
                Objetivo
              </h3>
              <p className="text-sm">{aluno.objetivo}</p>
            </div>
          )}
          {aluno.observacoes && (
            <div>
              <h3 className="text-text-secondary mb-1 text-xs font-medium uppercase tracking-wide">
                Observações
              </h3>
              <p className="whitespace-pre-wrap text-sm">{aluno.observacoes}</p>
            </div>
          )}
        </section>
      )}

      <CriarProtocoloDialog
        alunoId={id}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </main>
  );
}

function ProtocoloRow({
  alunoId,
  protocolo,
}: {
  alunoId: string;
  protocolo: Protocolo;
}) {
  const statusColor = {
    ativo: 'bg-success/15 text-success',
    rascunho: 'bg-warn/15 text-warn',
    arquivado: 'bg-bg-subtle text-text-tertiary',
  }[protocolo.status];

  return (
    <li>
      <Link
        to="/alunos/$id/protocolos/$pid"
        params={{ id: alunoId, pid: protocolo.id }}
        className="bg-bg-elevated border-border hover:border-border-strong flex items-center justify-between rounded-card border p-4 transition"
      >
        <div className="min-w-0">
          <p className="truncate font-medium">{protocolo.nome}</p>
          <p className="text-text-secondary text-xs">
            Início: {new Date(protocolo.dataInicio).toLocaleDateString('pt-BR')}
            {' · '}
            {protocolo.divisao}
          </p>
        </div>
        <span className={`shrink-0 rounded-pill px-3 py-1 text-xs ${statusColor}`}>
          {STATUS_LABELS[protocolo.status]}
        </span>
      </Link>
    </li>
  );
}
