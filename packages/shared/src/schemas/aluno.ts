import { z } from 'zod';
import { alunoStatusSchema, sexoSchema } from './enums.js';

const emptyToUndefined = (v: unknown) =>
  typeof v === 'string' && v.trim() === '' ? undefined : v;

export const alunoCreateSchema = z.object({
  nome: z.string().min(2, 'Informe o nome').max(120),
  email: z.email({ message: 'E-mail inválido' }),
  dataNascimento: z.preprocess(emptyToUndefined, z.iso.date().optional()),
  sexo: z.preprocess(emptyToUndefined, sexoSchema.optional()),
  objetivo: z.preprocess(emptyToUndefined, z.string().max(500).optional()),
  observacoes: z.preprocess(emptyToUndefined, z.string().max(1000).optional()),
});
export type AlunoCreate = z.infer<typeof alunoCreateSchema>;

export const alunoUpdateSchema = alunoCreateSchema.partial().extend({
  status: alunoStatusSchema.optional(),
});
export type AlunoUpdate = z.infer<typeof alunoUpdateSchema>;
