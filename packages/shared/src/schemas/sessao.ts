import { z } from 'zod';

export const sessaoIniciarSchema = z.object({
  treinoId: z.string().min(1),
  data: z.iso.date().optional(),
});
export type SessaoIniciar = z.infer<typeof sessaoIniciarSchema>;

export const sessaoFinalizarSchema = z.object({
  observacaoAluno: z.string().max(1000).optional(),
});
export type SessaoFinalizar = z.infer<typeof sessaoFinalizarSchema>;

export const serieRegistrarSchema = z.object({
  exercicioTreinoId: z.string().min(1),
  numeroSerie: z.number().int().min(1).max(99),
  repsFeitas: z.number().int().min(0).max(999),
  cargaKg: z.number().min(0).max(9999),
});
export type SerieRegistrar = z.infer<typeof serieRegistrarSchema>;

export const serieAtualizarSchema = z.object({
  repsFeitas: z.number().int().min(0).max(999).optional(),
  cargaKg: z.number().min(0).max(9999).optional(),
});
export type SerieAtualizar = z.infer<typeof serieAtualizarSchema>;

export const sessoesQuerySchema = z.object({
  alunoId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type SessoesQuery = z.infer<typeof sessoesQuerySchema>;
