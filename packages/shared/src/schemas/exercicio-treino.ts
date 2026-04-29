import { z } from 'zod';
import { tipoSerieSchema } from './enums.js';

export const exercicioTreinoCreateSchema = z.object({
  exercicioId: z.string().min(1),
  series: z.number().int().min(1).max(99),
  repsAlvo: z.string().min(1).max(30),
  cargaSugeridaKg: z.number().min(0).max(9999).optional(),
  descansoSegundos: z.number().int().min(0).max(3600).default(60),
  observacao: z.string().max(500).optional(),
  tipoSerie: tipoSerieSchema.default('normal'),
  ordem: z.number().int().min(0).optional(),
});
export type ExercicioTreinoCreate = z.infer<typeof exercicioTreinoCreateSchema>;

export const exercicioTreinoUpdateSchema = z.object({
  series: z.number().int().min(1).max(99).optional(),
  repsAlvo: z.string().min(1).max(30).optional(),
  cargaSugeridaKg: z.number().min(0).max(9999).nullable().optional(),
  descansoSegundos: z.number().int().min(0).max(3600).optional(),
  observacao: z.string().max(500).nullable().optional(),
  tipoSerie: tipoSerieSchema.optional(),
  ordem: z.number().int().min(0).optional(),
});
export type ExercicioTreinoUpdate = z.infer<typeof exercicioTreinoUpdateSchema>;

export const exercicioReordenarSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
});
export type ExercicioReordenar = z.infer<typeof exercicioReordenarSchema>;
