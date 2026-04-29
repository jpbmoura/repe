import { Avatar } from '@/components/avatar';
import { CompartilharConviteDialog } from '@/components/compartilhar-convite-dialog';
import { CriarProtocoloDialog } from '@/components/criar-protocolo-dialog';
import { StatusBadge } from '@/components/status-badge';
import { alunosApi, alunosKeys } from '@/lib/api/alunos';
import {
  protocolosApi,
  protocolosKeys,
  type Protocolo,
} from '@/lib/api/protocolos';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { ChevronLeft, Plus, Share2 } from 'lucide-react';
import { useState } from 'react';

export const Route = createFileRoute('/_auth/alunos/$id/')({
  component: AlunoDetalhePage,
});

function formatDataCurta(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  });
}

function AlunoDetalhePage() {
  const { id } = Route.useParams();
  const [conviteOpen, setConviteOpen] = useState(false);
  const [protocoloOpen, setProtocoloOpen] = useState(false);

  const { data, isPending, error } = useQuery({
    queryKey: alunosKeys.detalhe(id),
    queryFn: () => alunosApi.detalhe(id),
  });

  const protocolosQuery = useQuery({
    queryKey: protocolosKeys.doAluno(id),
    queryFn: () => protocolosApi.listar(id),
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
  const codigoAtual = aluno.convite?.codigo ?? null;
  const cadastrado = Boolean(aluno.userId);

  return (
    <main className="pb-nav mx-auto max-w-2xl px-4 pt-4">
      <Link
        to="/alunos"
        className="text-text-secondary hover:text-text-primary mb-3 inline-flex items-center gap-1 text-sm"
      >
        <ChevronLeft size={16} />
        Alunos
      </Link>

      <header className="mb-6 flex items-center gap-3">
        <Avatar nome={aluno.nome} size="lg" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-semibold">{aluno.nome}</h1>
          <p className="text-text-secondary truncate text-sm">{aluno.email}</p>
        </div>
        <button
          type="button"
          onClick={() => setConviteOpen(true)}
          className="bg-bg-subtle border-border text-text-secondary hover:text-text-primary hover:border-border-strong active:scale-95 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition"
          aria-label="Compartilhar convite"
          title="Compartilhar convite"
        >
          <Share2 size={16} />
        </button>
      </header>

      {!cadastrado && codigoAtual && (
        <section className="border-warn/30 bg-warn/5 mb-6 rounded-card border p-3">
          <div className="flex items-start gap-3">
            <StatusBadge status="pendente" size="sm" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Aluno ainda não criou conta</p>
              <p className="text-text-secondary mt-0.5 text-xs">
                Toque no botão{' '}
                <Share2 size={11} className="inline" aria-hidden /> acima para
                ver o código e compartilhar.
              </p>
            </div>
          </div>
        </section>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-text-secondary text-xs font-semibold uppercase tracking-wide">
            Protocolos
          </h2>
          <button
            type="button"
            onClick={() => setProtocoloOpen(true)}
            className="bg-accent text-bg-base hover:bg-accent-hover active:scale-95 inline-flex items-center gap-1 rounded-pill px-3 py-1.5 text-xs font-semibold transition"
          >
            <Plus size={12} strokeWidth={2.5} />
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
              <h3 className="text-text-secondary mb-1 text-xs font-semibold uppercase tracking-wide">
                Objetivo
              </h3>
              <p className="text-sm">{aluno.objetivo}</p>
            </div>
          )}
          {aluno.observacoes && (
            <div>
              <h3 className="text-text-secondary mb-1 text-xs font-semibold uppercase tracking-wide">
                Observações
              </h3>
              <p className="whitespace-pre-wrap text-sm">{aluno.observacoes}</p>
            </div>
          )}
        </section>
      )}

      <CompartilharConviteDialog
        alunoId={id}
        alunoNome={aluno.nome}
        codigoInicial={codigoAtual}
        cadastrado={cadastrado}
        open={conviteOpen}
        onOpenChange={setConviteOpen}
      />

      <CriarProtocoloDialog
        alunoId={id}
        open={protocoloOpen}
        onOpenChange={setProtocoloOpen}
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
  return (
    <li>
      <Link
        to="/alunos/$id/protocolos/$pid"
        params={{ id: alunoId, pid: protocolo.id }}
        className="bg-bg-elevated border-border hover:border-border-strong active:scale-[0.99] flex items-center gap-3 rounded-card border p-4 transition"
      >
        <div className="bg-bg-subtle flex h-10 w-10 shrink-0 items-center justify-center rounded-chip text-sm font-semibold">
          {protocolo.divisao === 'full_body'
            ? 'FB'
            : protocolo.divisao === 'custom'
              ? '—'
              : protocolo.divisao}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{protocolo.nome}</p>
          <p className="text-text-secondary text-xs">
            Início {formatDataCurta(protocolo.dataInicio)}
            {protocolo.dataFim && ` · Fim ${formatDataCurta(protocolo.dataFim)}`}
          </p>
        </div>
        <StatusBadge status={protocolo.status} size="sm" />
      </Link>
    </li>
  );
}
