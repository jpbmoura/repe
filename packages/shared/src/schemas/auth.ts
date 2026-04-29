import { z } from 'zod';
import { CODIGO_CONVITE_LENGTH } from '../codigo/index.js';

export const loginSchema = z.object({
  email: z.email({ message: 'E-mail inválido' }),
  password: z.string().min(8, 'Senha precisa ter ao menos 8 caracteres'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const cadastroPersonalSchema = z.object({
  nome: z.string().min(2, 'Informe seu nome').max(120),
  email: z.email({ message: 'E-mail inválido' }),
  password: z
    .string()
    .min(8, 'Senha precisa ter ao menos 8 caracteres')
    .max(72, 'Senha muito longa'),
});
export type CadastroPersonalInput = z.infer<typeof cadastroPersonalSchema>;

export const cadastroAlunoSchema = z.object({
  nome: z.string().min(2, 'Informe seu nome').max(120),
  email: z.email({ message: 'E-mail inválido' }),
  password: z
    .string()
    .min(8, 'Senha precisa ter ao menos 8 caracteres')
    .max(72, 'Senha muito longa'),
  codigo: z
    .string()
    .length(CODIGO_CONVITE_LENGTH, `Código deve ter ${CODIGO_CONVITE_LENGTH} caracteres`),
});
export type CadastroAlunoInput = z.infer<typeof cadastroAlunoSchema>;
