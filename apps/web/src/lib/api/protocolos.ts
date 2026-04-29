import type {
  CategoriaExercicio,
  Divisao,
  Equipamento,
  ExercicioReordenar,
  ExercicioTreinoCreate,
  ExercicioTreinoUpdate,
  GrupoMuscular,
  ProtocoloCreate,
  ProtocoloStatus,
  ProtocoloUpdate,
  TipoSerie,
  TreinoCreate,
  TreinoUpdate,
} from '@repe/shared/schemas';
import { api } from '../api';

export type Protocolo = {
  id: string;
  alunoId: string;
  nome: string;
  dataInicio: string;
  dataFim: string | null;
  divisao: Divisao;
  status: ProtocoloStatus;
  createdAt: string;
  updatedAt: string;
};

export type ExercicioRef = {
  id: string;
  nome: string;
  slug: string;
  grupoMuscularPrimario: GrupoMuscular;
  equipamento: Equipamento;
  categoria: CategoriaExercicio;
  youtubeId: string | null;
  youtubeUrl: string | null;
  instrucoes: string | null;
};

export type ExercicioTreino = {
  id: string;
  treinoId: string;
  exercicioId: string;
  ordem: number;
  series: number;
  repsAlvo: string;
  cargaSugeridaKg: string | null;
  descansoSegundos: number;
  observacao: string | null;
  tipoSerie: TipoSerie;
  exercicio: ExercicioRef;
};

export type Treino = {
  id: string;
  protocoloId: string;
  letra: string;
  nome: string;
  diasSemana: number[];
  ordem: number;
  exercicios: ExercicioTreino[];
};

export type ProtocoloDetalhe = Protocolo & {
  treinos: Treino[];
};

export const protocolosApi = {
  listar: (alunoId: string) =>
    api.get<{ protocolos: Protocolo[] }>(`/api/alunos/${alunoId}/protocolos`),
  criar: (alunoId: string, data: ProtocoloCreate) =>
    api.post<{ protocolo: Protocolo }>(`/api/alunos/${alunoId}/protocolos`, data),
  detalhe: (id: string) =>
    api.get<{ protocolo: ProtocoloDetalhe }>(`/api/protocolos/${id}`),
  atualizar: (id: string, data: ProtocoloUpdate) =>
    api.patch<{ protocolo: Protocolo }>(`/api/protocolos/${id}`, data),
  ativar: (id: string) =>
    api.post<{ protocolo: Protocolo }>(`/api/protocolos/${id}/ativar`),
  duplicar: (id: string) =>
    api.post<{ protocolo: Protocolo }>(`/api/protocolos/${id}/duplicar`),
  remover: (id: string) => api.delete<void>(`/api/protocolos/${id}`),

  criarTreino: (protocoloId: string, data: TreinoCreate) =>
    api.post<{ treino: Treino }>(`/api/protocolos/${protocoloId}/treinos`, data),
  atualizarTreino: (id: string, data: TreinoUpdate) =>
    api.patch<{ treino: Treino }>(`/api/treinos/${id}`, data),
  duplicarTreino: (id: string) =>
    api.post<{ treino: Treino }>(`/api/treinos/${id}/duplicar`),
  removerTreino: (id: string) => api.delete<void>(`/api/treinos/${id}`),

  adicionarExercicio: (treinoId: string, data: ExercicioTreinoCreate) =>
    api.post<{ exercicioTreino: ExercicioTreino }>(
      `/api/treinos/${treinoId}/exercicios`,
      data,
    ),
  atualizarExercicio: (id: string, data: ExercicioTreinoUpdate) =>
    api.patch<{ exercicioTreino: ExercicioTreino }>(
      `/api/exercicios-treino/${id}`,
      data,
    ),
  reordenarExercicios: (treinoId: string, data: ExercicioReordenar) =>
    api.patch<{ exercicios: ExercicioTreino[] }>(
      `/api/treinos/${treinoId}/exercicios/reordenar`,
      data,
    ),
  removerExercicio: (id: string) =>
    api.delete<void>(`/api/exercicios-treino/${id}`),
};

export const protocolosKeys = {
  all: ['protocolos'] as const,
  doAluno: (alunoId: string) =>
    [...protocolosKeys.all, 'aluno', alunoId] as const,
  detalhe: (id: string) => [...protocolosKeys.all, 'detalhe', id] as const,
  volume: (id: string) => [...protocolosKeys.all, 'volume', id] as const,
};

export type VolumeResponse = {
  porGrupo: Array<{
    grupo: string;
    series: number;
    classificacao: 'baixo' | 'ideal' | 'alto';
  }>;
  porTreino: Array<{
    treinoId: string;
    letra: string;
    nome: string;
    tempoEstimadoSeg: number;
    totalSeries: number;
  }>;
};

export const volumeApi = {
  doProtocolo: (id: string) =>
    api.get<VolumeResponse>(`/api/protocolos/${id}/volume`),
};

export const DIVISAO_LABELS: Record<Divisao, string> = {
  A: 'A',
  AB: 'A/B',
  ABC: 'A/B/C',
  ABCD: 'A/B/C/D',
  ABCDE: 'A/B/C/D/E',
  full_body: 'Full body',
  custom: 'Personalizada',
};

export const STATUS_LABELS: Record<ProtocoloStatus, string> = {
  rascunho: 'Rascunho',
  ativo: 'Ativo',
  arquivado: 'Arquivado',
};
