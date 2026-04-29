import type {
  CategoriaExercicio,
  Equipamento,
  GrupoMuscular,
  SerieAtualizar,
  SerieRegistrar,
  SessaoFinalizar,
  SessaoIniciar,
  TipoSerie,
} from '@repe/shared/schemas';
import { api } from '../api';

export type Aluno = {
  id: string;
  nome: string;
  email: string;
  status: 'ativo' | 'inativo';
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
  ultimaExecucao?: { cargaKg: string; repsFeitas: number } | null;
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

export type SessaoEmAndamento = {
  id: string;
  alunoId: string;
  treinoId: string;
  data: string;
  horaInicio: string;
  horaFim: string | null;
  observacaoAluno: string | null;
};

export type SerieExecutada = {
  id: string;
  sessaoId: string;
  exercicioTreinoId: string;
  numeroSerie: number;
  repsFeitas: number;
  cargaKg: string;
  concluidoEm: string;
};

export type HojeResponse = {
  aluno: Aluno;
  protocolo: { id: string; nome: string } | null;
  treino: Treino | null;
  sessaoAtiva: SessaoEmAndamento | null;
};

export type SessaoDetalhe = SessaoEmAndamento & {
  treino: {
    id: string;
    letra: string;
    nome: string;
    exercicios: ExercicioTreino[];
  };
  series: SerieExecutada[];
};

export type SessaoHistorico = SessaoEmAndamento & {
  treino: { id: string; letra: string; nome: string };
  series: Array<
    SerieExecutada & {
      exercicioTreino: ExercicioTreino & { exercicio: ExercicioRef };
    }
  >;
};

export const sessoesApi = {
  hoje: () => api.get<HojeResponse>('/api/aluno/hoje'),
  detalhe: (id: string) =>
    api.get<{ sessao: SessaoDetalhe }>(`/api/sessoes/${id}`),
  iniciar: (data: SessaoIniciar) =>
    api.post<{ sessao: SessaoEmAndamento }>('/api/sessoes', data),
  finalizar: (id: string, data: SessaoFinalizar) =>
    api.post<{ sessao: SessaoEmAndamento }>(`/api/sessoes/${id}/finalizar`, data),
  registrarSerie: (sessaoId: string, data: SerieRegistrar) =>
    api.post<{ serie: SerieExecutada }>(`/api/sessoes/${sessaoId}/series`, data),
  atualizarSerie: (id: string, data: SerieAtualizar) =>
    api.patch<{ serie: SerieExecutada }>(`/api/series-executadas/${id}`, data),
  historico: (params: { alunoId?: string; limit?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.alunoId) qs.set('alunoId', params.alunoId);
    if (params.limit) qs.set('limit', String(params.limit));
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return api.get<{ sessoes: SessaoHistorico[] }>(`/api/sessoes${suffix}`);
  },
};

export const sessoesKeys = {
  all: ['sessoes'] as const,
  hoje: () => [...sessoesKeys.all, 'hoje'] as const,
  detalhe: (id: string) => [...sessoesKeys.all, 'detalhe', id] as const,
  historico: (alunoId?: string) =>
    [...sessoesKeys.all, 'historico', alunoId ?? 'eu'] as const,
};
