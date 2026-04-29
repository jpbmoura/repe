import { pgEnum } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['personal', 'aluno']);

export const sexoEnum = pgEnum('sexo', ['M', 'F', 'outro']);

export const alunoStatusEnum = pgEnum('aluno_status', ['ativo', 'inativo']);

export const divisaoEnum = pgEnum('divisao', [
  'A',
  'AB',
  'ABC',
  'ABCD',
  'ABCDE',
  'full_body',
  'custom',
]);

export const protocoloStatusEnum = pgEnum('protocolo_status', [
  'rascunho',
  'ativo',
  'arquivado',
]);

export const grupoMuscularEnum = pgEnum('grupo_muscular', [
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

export const equipamentoEnum = pgEnum('equipamento', [
  'barra',
  'halter',
  'maquina',
  'peso_corporal',
  'cabo',
  'kettlebell',
  'anilha',
  'outro',
]);

export const categoriaExercicioEnum = pgEnum('categoria_exercicio', [
  'composto',
  'isolado',
]);

export const padraoMovimentoEnum = pgEnum('padrao_movimento', [
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

export const escopoExercicioEnum = pgEnum('escopo_exercicio', ['publico', 'privado']);

export const tipoSerieEnum = pgEnum('tipo_serie', [
  'normal',
  'drop_set',
  'bi_set',
  'super_set',
]);
