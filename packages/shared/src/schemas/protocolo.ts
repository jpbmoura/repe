import { z } from 'zod';
import { divisaoSchema, protocoloStatusSchema } from './enums.js';

const emptyToUndefined = (v: unknown) =>
  typeof v === 'string' && v.trim() === '' ? undefined : v;

const optionalIsoDate = () =>
  z.preprocess(emptyToUndefined, z.iso.date().optional());

export const protocoloCreateSchema = z.object({
  nome: z.string().min(1, 'Informe o nome do protocolo').max(120),
  dataInicio: z.iso.date(),
  dataFim: optionalIsoDate(),
  divisao: divisaoSchema,
});
export type ProtocoloCreate = z.infer<typeof protocoloCreateSchema>;

export const protocoloUpdateSchema = z.object({
  nome: z.string().min(1).max(120).optional(),
  dataInicio: z.iso.date().optional(),
  dataFim: z.preprocess(emptyToUndefined, z.iso.date().nullable().optional()),
  divisao: divisaoSchema.optional(),
  status: protocoloStatusSchema.optional(),
});
export type ProtocoloUpdate = z.infer<typeof protocoloUpdateSchema>;
