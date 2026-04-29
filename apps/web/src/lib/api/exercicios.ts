import type {
  ExercicioCreate,
  ExercicioUpdate,
  GrupoMuscular,
  Equipamento,
  EscopoBusca,
} from '@repe/shared/schemas';
import { api } from '../api';

export type Exercicio = {
  id: string;
  nome: string;
  slug: string;
  grupoMuscularPrimario: GrupoMuscular;
  gruposSecundarios: GrupoMuscular[];
  equipamento: Equipamento;
  categoria: 'composto' | 'isolado';
  padraoMovimento: string | null;
  youtubeUrl: string | null;
  youtubeId: string | null;
  instrucoes: string | null;
  escopo: 'publico' | 'privado';
  criadoPor: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ExercicioFilters = {
  busca?: string;
  grupoMuscular?: GrupoMuscular;
  equipamento?: Equipamento;
  escopo?: EscopoBusca;
};

function buildQuery(filters: ExercicioFilters): string {
  const params = new URLSearchParams();
  if (filters.busca) params.set('busca', filters.busca);
  if (filters.grupoMuscular) params.set('grupoMuscular', filters.grupoMuscular);
  if (filters.equipamento) params.set('equipamento', filters.equipamento);
  if (filters.escopo) params.set('escopo', filters.escopo);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export const exerciciosApi = {
  listar: (filters: ExercicioFilters = {}) =>
    api.get<{ exercicios: Exercicio[] }>(`/api/exercicios${buildQuery(filters)}`),
  criar: (data: ExercicioCreate) =>
    api.post<{ exercicio: Exercicio }>('/api/exercicios', data),
  atualizar: (id: string, data: ExercicioUpdate) =>
    api.patch<{ exercicio: Exercicio }>(`/api/exercicios/${id}`, data),
  remover: (id: string) => api.delete<void>(`/api/exercicios/${id}`),
};

export const exerciciosKeys = {
  all: ['exercicios'] as const,
  lista: (filters: ExercicioFilters) =>
    [...exerciciosKeys.all, 'lista', filters] as const,
};

export const GRUPO_LABELS: Record<GrupoMuscular, string> = {
  peito: 'Peito',
  costas: 'Costas',
  pernas_quadriceps: 'Quadríceps',
  pernas_posterior: 'Posterior',
  pernas_gluteo: 'Glúteos',
  pernas_panturrilha: 'Panturrilha',
  ombro: 'Ombro',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  antebraco: 'Antebraço',
  core: 'Core',
  trapezio: 'Trapézio',
};

export const EQUIPAMENTO_LABELS: Record<Equipamento, string> = {
  barra: 'Barra',
  halter: 'Halter',
  maquina: 'Máquina',
  peso_corporal: 'Peso corporal',
  cabo: 'Cabo',
  kettlebell: 'Kettlebell',
  anilha: 'Anilha',
  outro: 'Outro',
};
