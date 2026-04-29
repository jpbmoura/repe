import { TreinoCard } from '@/components/editor/treino-card';
import { SegmentedControl } from '@/components/segmented-control';
import { StatusBadge } from '@/components/status-badge';
import { alunosApi, alunosKeys } from '@/lib/api/alunos';
import {
  DIVISAO_LABELS,
  protocolosApi,
  protocolosKeys,
  volumeApi,
  type ProtocoloDetalhe,
} from '@/lib/api/protocolos';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { ChevronLeft, Copy, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';

export const Route = createFileRoute('/_auth/alunos/$id/protocolos/$pid')({
  component: ProtocoloEditorPage,
});

function formatPeriodo(inicio: string, fim: string | null): string {
  const i = new Date(inicio);
  const inicioFmt = i.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  });
  if (!fim) return `Início ${inicioFmt}`;
  const f = new Date(fim);
  const fimFmt = f.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  });
  const semanas = Math.max(
    1,
    Math.round((f.getTime() - i.getTime()) / (1000 * 60 * 60 * 24 * 7)),
  );
  return `${inicioFmt} — ${fimFmt} · ${semanas} semana${semanas === 1 ? '' : 's'}`;
}

function ProtocoloEditorPage() {
  const { id: alunoId, pid: protocoloId } = Route.useParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [treinoAtivo, setTreinoAtivo] = useState<string | null>(null);

  const { data, isPending } = useQuery({
    queryKey: protocolosKeys.detalhe(protocoloId),
    queryFn: () => protocolosApi.detalhe(protocoloId),
  });

  const alunoQuery = useQuery({
    queryKey: alunosKeys.detalhe(alunoId),
    queryFn: () => alunosApi.detalhe(alunoId),
  });

  const volumeQuery = useQuery({
    queryKey: protocolosKeys.volume(protocoloId),
    queryFn: () => volumeApi.doProtocolo(protocoloId),
  });

  useEffect(() => {
    if (
      data &&
      treinoAtivo &&
      !data.protocolo.treinos.find((t) => t.id === treinoAtivo)
    ) {
      setTreinoAtivo(null);
    }
  }, [data, treinoAtivo]);

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
      <main className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-text-secondary text-sm">Carregando…</p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-danger text-sm">Protocolo não encontrado.</p>
      </main>
    );
  }

  const { protocolo } = data;
  const aluno = alunoQuery.data?.aluno;
  const bloqueado = protocolo.status === 'arquivado';
  const treinoSelecionado =
    protocolo.treinos.find((t) => t.id === treinoAtivo) ?? protocolo.treinos[0];

  return (
    <main className="pb-nav mx-auto max-w-2xl px-4 pt-4">
      <header className="mb-3 flex items-center justify-between">
        <Link
          to="/alunos/$id"
          params={{ id: alunoId }}
          className="text-text-secondary hover:text-text-primary inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft size={16} />
          Voltar
        </Link>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => duplicar.mutate()}
            disabled={duplicar.isPending}
            className="bg-bg-subtle border-border hover:border-border-strong inline-flex items-center gap-1 rounded-pill border px-3 py-1.5 text-xs font-medium transition"
          >
            <Copy size={12} />
            Duplicar
          </button>
        </div>
      </header>

      <SubHeader
        aluno={aluno?.nome ?? '…'}
        protocolo={protocolo}
      />

      <h1 className="text-3xl font-semibold tracking-tight">{protocolo.nome}</h1>
      <p className="text-text-secondary mt-1 text-sm">
        {formatPeriodo(protocolo.dataInicio, protocolo.dataFim)} ·{' '}
        {DIVISAO_LABELS[protocolo.divisao]}
      </p>

      {protocolo.status === 'rascunho' && (
        <button
          type="button"
          onClick={() => ativar.mutate()}
          disabled={ativar.isPending || protocolo.treinos.length === 0}
          className="bg-accent text-bg-base hover:bg-accent-hover active:bg-accent-pressed disabled:opacity-50 mt-4 inline-flex w-full items-center justify-center rounded-pill px-4 py-3 text-sm font-semibold transition"
        >
          {ativar.isPending ? 'Ativando…' : 'Ativar protocolo'}
        </button>
      )}

      <div className="mt-6">
        <TreinoTabs
          protocolo={protocolo}
          ativo={treinoSelecionado?.id ?? null}
          onSelecionar={setTreinoAtivo}
        />
      </div>

      <div className="mt-6">
        {treinoSelecionado ? (
          <TreinoCard
            treino={treinoSelecionado}
            protocoloId={protocoloId}
            bloqueado={bloqueado}
            volume={volumeQuery.data}
          />
        ) : (
          <div className="bg-bg-elevated border-border rounded-card border p-6 text-center">
            <p className="text-text-secondary text-sm">
              Crie o primeiro treino acima.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

function SubHeader({
  aluno,
  protocolo,
}: {
  aluno: string;
  protocolo: ProtocoloDetalhe;
}) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <p className="text-accent text-xs font-semibold uppercase tracking-wider">
        {aluno}
      </p>
      <span className="text-text-tertiary text-xs">·</span>
      <p className="text-text-secondary text-xs uppercase tracking-wide">
        {protocolo.nome}
      </p>
      <div className="ml-auto">
        <StatusBadge status={protocolo.status} size="sm" />
      </div>
    </div>
  );
}

function TreinoTabs({
  protocolo,
  ativo,
  onSelecionar,
}: {
  protocolo: ProtocoloDetalhe;
  ativo: string | null;
  onSelecionar: (id: string) => void;
}) {
  const queryClient = useQueryClient();

  const proximaLetra = (() => {
    const usadas = new Set(protocolo.treinos.map((t) => t.letra.toUpperCase()));
    for (const letra of ['A', 'B', 'C', 'D', 'E', 'F', 'G']) {
      if (!usadas.has(letra)) return letra;
    }
    return `T${protocolo.treinos.length + 1}`;
  })();

  const criarTreino = useMutation({
    mutationFn: () =>
      protocolosApi.criarTreino(protocolo.id, {
        letra: proximaLetra,
        nome: `Treino ${proximaLetra}`,
        diasSemana: [],
      }),
    onSuccess: ({ treino }) => {
      queryClient.invalidateQueries({
        queryKey: protocolosKeys.detalhe(protocolo.id),
      });
      queryClient.invalidateQueries({
        queryKey: protocolosKeys.volume(protocolo.id),
      });
      onSelecionar(treino.id);
    },
  });

  if (protocolo.treinos.length === 0) {
    return (
      <button
        type="button"
        onClick={() => criarTreino.mutate()}
        disabled={criarTreino.isPending}
        className="bg-accent text-bg-base hover:bg-accent-hover inline-flex w-full items-center justify-center gap-2 rounded-pill px-4 py-3 text-sm font-semibold transition"
      >
        <Plus size={16} />
        Criar primeiro treino
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <SegmentedControl
        items={protocolo.treinos.map((t) => ({
          value: t.id,
          label: t.letra,
        }))}
        value={ativo ?? protocolo.treinos[0]!.id}
        onChange={onSelecionar}
        className="flex-1"
      />
      <button
        type="button"
        onClick={() => criarTreino.mutate()}
        disabled={criarTreino.isPending}
        className="bg-bg-subtle border-border text-text-secondary hover:text-text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-chip border"
        aria-label="Adicionar treino"
      >
        <Plus size={16} />
      </button>
    </div>
  );
}
