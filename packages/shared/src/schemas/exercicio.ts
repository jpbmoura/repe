import { z } from 'zod';
import {
  categoriaExercicioSchema,
  equipamentoSchema,
  escopoBuscaSchema,
  escopoExercicioSchema,
  grupoMuscularSchema,
  padraoMovimentoSchema,
} from './enums.js';

export const exercicioCreateSchema = z.object({
  nome: z.string().min(2).max(120),
  grupoMuscularPrimario: grupoMuscularSchema,
  gruposSecundarios: z.array(grupoMuscularSchema).default([]),
  equipamento: equipamentoSchema,
  categoria: categoriaExercicioSchema,
  padraoMovimento: padraoMovimentoSchema.optional(),
  youtubeUrl: z.url({ message: 'URL inválida' }).optional().or(z.literal('')),
  instrucoes: z.string().max(2000).optional(),
});
export type ExercicioCreate = z.infer<typeof exercicioCreateSchema>;

export const exercicioUpdateSchema = exercicioCreateSchema.partial();
export type ExercicioUpdate = z.infer<typeof exercicioUpdateSchema>;

export const exercicioBuscaSchema = z.object({
  busca: z.string().optional(),
  grupoMuscular: grupoMuscularSchema.optional(),
  equipamento: equipamentoSchema.optional(),
  escopo: escopoBuscaSchema.default('todos'),
});
export type ExercicioBusca = z.infer<typeof exercicioBuscaSchema>;

export type ExercicioEscopo = z.infer<typeof escopoExercicioSchema>;
