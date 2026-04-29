import { z } from 'zod';

export const sexoSchema = z.enum(['M', 'F', 'outro']);
export type Sexo = z.infer<typeof sexoSchema>;

export const alunoStatusSchema = z.enum(['ativo', 'inativo']);
export type AlunoStatus = z.infer<typeof alunoStatusSchema>;

export const divisaoSchema = z.enum([
  'A',
  'AB',
  'ABC',
  'ABCD',
  'ABCDE',
  'full_body',
  'custom',
]);
export type Divisao = z.infer<typeof divisaoSchema>;

export const protocoloStatusSchema = z.enum(['rascunho', 'ativo', 'arquivado']);
export type ProtocoloStatus = z.infer<typeof protocoloStatusSchema>;

export const grupoMuscularSchema = z.enum([
  'peito',
  'costas',
  'pernas_quadriceps',
  'pernas_posterior',
  'pernas_gluteo',
  'pernas_panturrilha',
  'ombro',
  'biceps',
  'triceps',
  'antebraco',
  'core',
  'trapezio',
]);
export type GrupoMuscular = z.infer<typeof grupoMuscularSchema>;

export const equipamentoSchema = z.enum([
  'barra',
  'halter',
  'maquina',
  'peso_corporal',
  'cabo',
  'kettlebell',
  'anilha',
  'outro',
]);
export type Equipamento = z.infer<typeof equipamentoSchema>;

export const categoriaExercicioSchema = z.enum(['composto', 'isolado']);
export type CategoriaExercicio = z.infer<typeof categoriaExercicioSchema>;

export const padraoMovimentoSchema = z.enum([
  'empurrar_horizontal',
  'empurrar_vertical',
  'puxar_horizontal',
  'puxar_vertical',
  'agachar',
  'flexao_quadril',
  'isolado',
  'core',
  'outro',
]);
export type PadraoMovimento = z.infer<typeof padraoMovimentoSchema>;

export const escopoExercicioSchema = z.enum(['publico', 'privado']);
export type EscopoExercicio = z.infer<typeof escopoExercicioSchema>;

export const escopoBuscaSchema = z.enum(['publico', 'privado', 'todos']);
export type EscopoBusca = z.infer<typeof escopoBuscaSchema>;

export const tipoSerieSchema = z.enum(['normal', 'drop_set', 'bi_set', 'super_set']);
export type TipoSerie = z.infer<typeof tipoSerieSchema>;
