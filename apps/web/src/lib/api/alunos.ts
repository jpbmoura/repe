import type { AlunoCreate, AlunoUpdate } from '@repe/shared/schemas';
import { api } from '../api';

export type AlunoListItem = {
  id: string;
  nome: string;
  email: string;
  status: 'ativo' | 'inativo';
  userId: string | null;
  createdAt: string;
  codigo: string | null;
  codigoUsadoEm: string | null;
};

export type AlunoDetalhe = {
  id: string;
  personalId: string;
  userId: string | null;
  nome: string;
  email: string;
  dataNascimento: string | null;
  sexo: 'M' | 'F' | 'outro' | null;
  objetivo: string | null;
  observacoes: string | null;
  status: 'ativo' | 'inativo';
  createdAt: string;
  updatedAt: string;
  convite: {
    id: string;
    codigo: string;
    expiresAt: string;
    usadoEm: string | null;
  } | null;
};

export const alunosApi = {
  listar: () => api.get<{ alunos: AlunoListItem[] }>('/api/alunos'),
  detalhe: (id: string) => api.get<{ aluno: AlunoDetalhe }>(`/api/alunos/${id}`),
  criar: (data: AlunoCreate) =>
    api.post<{ aluno: AlunoDetalhe; codigo: string }>('/api/alunos', data),
  atualizar: (id: string, data: AlunoUpdate) =>
    api.patch<{ aluno: AlunoDetalhe }>(`/api/alunos/${id}`, data),
  inativar: (id: string) => api.delete<void>(`/api/alunos/${id}`),
  regenerarCodigo: (id: string) =>
    api.post<{ codigo: string }>(`/api/alunos/${id}/regenerar-codigo`),
};

export const alunosKeys = {
  all: ['alunos'] as const,
  lista: () => [...alunosKeys.all, 'lista'] as const,
  detalhe: (id: string) => [...alunosKeys.all, 'detalhe', id] as const,
};
