import { z } from 'zod';

const diasSemanaSchema = z
  .array(z.number().int().min(0).max(6))
  .max(7);

export const treinoCreateSchema = z.object({
  letra: z.string().min(1).max(2),
  nome: z.string().min(1).max(120),
  diasSemana: diasSemanaSchema.default([]),
  ordem: z.number().int().min(0).optional(),
});
export type TreinoCreate = z.infer<typeof treinoCreateSchema>;

export const treinoUpdateSchema = z.object({
  letra: z.string().min(1).max(2).optional(),
  nome: z.string().min(1).max(120).optional(),
  diasSemana: diasSemanaSchema.optional(),
  ordem: z.number().int().min(0).optional(),
});
export type TreinoUpdate = z.infer<typeof treinoUpdateSchema>;
