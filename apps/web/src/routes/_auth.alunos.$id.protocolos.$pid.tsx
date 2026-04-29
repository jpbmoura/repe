import { Field } from '@/components/field';
import { TreinoCard } from '@/components/editor/treino-card';
import { VolumeResumo } from '@/components/editor/volume-resumo';
import {
  DIVISAO_LABELS,
  protocolosApi,
  protocolosKeys,
  STATUS_LABELS,
  type ProtocoloDetalhe,
} from '@/lib/api/protocolos';
import { cn } from '@repe/ui';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { ChevronLeft, Copy, Plus } from 'lucide-react';
import { useState } from 'react';

export const Route = createFileRoute('/_auth/alunos/$id/protocolos/$pid')({
  component: ProtocoloEditorPage,
});

function ProtocoloEditorPage() {
  const { id: alunoId, pid: protocoloId } = Route.useParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [treinoAtivo, setTreinoAtivo] = useState<string | null>(null);

  const { data, isPending } = useQuery({
    queryKey: protocolosKeys.detalhe(protocoloId),
    queryFn: () => protocolosApi.detalhe(protocoloId),
  });

  const ativar = useMutation({
    mutationFn: () => protocolosApi.ativar(protocoloId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: protocolosKeys.detalhe(protocoloId),
      });
      queryClient.invalidateQueries({
        queryKey: protocolosKeys.doAluno(alunoId),
      });
    },
  });

  const duplicar = useMutation({
    mutationFn: () => protocolosApi.duplicar(protocoloId),
    onSuccess: ({ protocolo }) => {
      queryClient.invalidateQueries({
        queryKey: protocolosKeys.doAluno(alunoId),
      });
      navigate({
        to: '/alunos/$id/protocolos/$pid',
        params: { id: alunoId, pid: protocolo.id },
      });
    },
  });

  if (isPending) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-text-secondary text-sm">Carregando…</p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-danger text-sm">Protocolo não encontrado.</p>
      </main>
    );
  }

  const { protocolo } = data;
  const bloqueado = protocolo.status === 'arquivado';
  const treinoSelecionado =
    protocolo.treinos.find((t) => t.id === treinoAtivo) ?? protocolo.treinos[0];

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 pb-28">
      <Link
        to="/alunos/$id"
        params={{ id: alunoId }}
        className="text-text-secondary hover:text-text-primary mb-4 inline-flex items-center gap-1 text-sm"
      >
        <ChevronLeft size={16} />
        Voltar para o aluno
      </Link>

      <Header
        protocolo={protocolo}
        onAtivar={() => ativar.mutate()}
        ativando={ativar.isPending}
        onDuplicar={() => duplicar.mutate()}
        duplicando={duplicar.isPending}
      />

      <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <TreinosTabs
            treinos={protocolo.treinos}
            ativo={treinoSelecionado?.id ?? null}
            onSelecionar={setTreinoAtivo}
            protocoloId={protocoloId}
            divisao={protocolo.divisao}
          />

          {treinoSelecionado ? (
            <TreinoCard
              treino={treinoSelecionado}
              protocoloId={protocoloId}
              bloqueado={bloqueado}
            />
          ) : (
            <div className="bg-bg-elevated border-border rounded-card border p-6 text-center">
              <p className="text-text-secondary text-sm">
                Crie o primeiro treino acima.
              </p>
            </div>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          <VolumeResumo protocoloId={protocoloId} />
        </aside>
      </div>
    </main>
  );
}

function Header({
  protocolo,
  onAtivar,
  ativando,
  onDuplicar,
  duplicando,
}: {
  protocolo: ProtocoloDetalhe;
  onAtivar: () => void;
  ativando: boolean;
  onDuplicar: () => void;
  duplicando: boolean;
}) {
  const statusColor = {
    ativo: 'bg-success/15 text-success',
    rascunho: 'bg-warn/15 text-warn',
    arquivado: 'bg-bg-subtle text-text-tertiary',
  }[protocolo.status];

  return (
    <header className="mb-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold">{protocolo.nome}</h1>
          <div className="text-text-secondary mt-1 flex items-center gap-2 text-sm">
            <span
              className={`rounded-pill px-2 py-0.5 text-xs ${statusColor}`}
            >
              {STATUS_LABELS[protocolo.status]}
            </span>
            <span>{DIVISAO_LABELS[protocolo.divisao]}</span>
            <span>·</span>
            <span>
              Início: {new Date(protocolo.dataInicio).toLocaleDateString('pt-BR')}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onDuplicar}
            disabled={duplicando}
            className="bg-bg-subtle border-border hover:border-border-strong inline-flex items-center gap-1 rounded-pill border px-3 py-2 text-xs font-medium transition"
          >
            <Copy size={14} />
            Duplicar
          </button>
          {protocolo.status === 'rascunho' && (
            <button
              type="button"
              onClick={onAtivar}
              disabled={ativando}
              className="bg-accent text-bg-base hover:bg-accent-hover active:bg-accent-pressed disabled:opacity-60 rounded-pill px-4 py-2 text-sm font-medium transition"
            >
              {ativando ? 'Ativando…' : 'Ativar protocolo'}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

function TreinosTabs({
  treinos,
  ativo,
  onSelecionar,
  protocoloId,
  divisao,
}: {
  treinos: ProtocoloDetalhe['treinos'];
  ativo: string | null;
  onSelecionar: (id: string) => void;
  protocoloId: string;
  divisao: ProtocoloDetalhe['divisao'];
}) {
  const queryClient = useQueryClient();

  const proximaLetra = (() => {
    const usadas = new Set(treinos.map((t) => t.letra.toUpperCase()));
    for (const letra of ['A', 'B', 'C', 'D', 'E', 'F', 'G']) {
      if (!usadas.has(letra)) return letra;
    }
    return `T${treinos.length + 1}`;
  })();

  const criarTreino = useMutation({
    mutationFn: () =>
      protocolosApi.criarTreino(protocoloId, {
        letra: proximaLetra,
        nome: `Treino ${proximaLetra}`,
        diasSemana: [],
      }),
    onSuccess: ({ treino }) => {
      queryClient.invalidateQueries({
        queryKey: protocolosKeys.detalhe(protocoloId),
      });
      queryClient.invalidateQueries({
        queryKey: protocolosKeys.volume(protocoloId),
      });
      onSelecionar(treino.id);
    },
  });

  return (
    <div className="flex flex-wrap items-center gap-2">
      {treinos.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onSelecionar(t.id)}
          className={cn(
            'rounded-pill px-4 py-2 text-sm font-medium transition',
            ativo === t.id
              ? 'bg-accent text-bg-base'
              : 'bg-bg-subtle text-text-secondary hover:text-text-primary',
          )}
        >
          {t.letra}
          <span className="text-text-secondary ml-1.5 text-xs">
            ({t.exercicios.length})
          </span>
        </button>
      ))}
      <button
        type="button"
        onClick={() => criarTreino.mutate()}
        disabled={criarTreino.isPending}
        className="text-text-secondary hover:text-text-primary inline-flex items-center gap-1 rounded-pill border border-dashed border-border px-3 py-2 text-sm transition"
      >
        <Plus size={14} />
        {treinos.length === 0 ? 'Criar treino' : 'Treino'}
      </button>
    </div>
  );
}
