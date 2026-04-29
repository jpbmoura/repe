import { createId } from '@paralleldrive/cuid2';
import {
  date,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { alunos } from './alunos.js';
import { divisaoEnum, protocoloStatusEnum, tipoSerieEnum } from './enums.js';
import { exercicios } from './exercicios.js';

export const protocolos = pgTable(
  'protocolos',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    alunoId: text('aluno_id')
      .notNull()
      .references(() => alunos.id, { onDelete: 'cascade' }),
    nome: text('nome').notNull(),
    dataInicio: date('data_inicio').notNull(),
    dataFim: date('data_fim'),
    divisao: divisaoEnum('divisao').notNull(),
    status: protocoloStatusEnum('status').notNull().default('rascunho'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
  },
  (t) => [index('protocolos_aluno_status_idx').on(t.alunoId, t.status)],
);

export const treinosProtocolo = pgTable(
  'treinos_protocolo',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    protocoloId: text('protocolo_id')
      .notNull()
      .references(() => protocolos.id, { onDelete: 'cascade' }),
    letra: text('letra').notNull(),
    nome: text('nome').notNull(),
    diasSemana: integer('dias_semana').array().notNull().default([]),
    ordem: integer('ordem').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
  },
  (t) => [index('treinos_protocolo_protocolo_idx').on(t.protocoloId)],
);

export const exerciciosTreino = pgTable(
  'exercicios_treino',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    treinoId: text('treino_id')
      .notNull()
      .references(() => treinosProtocolo.id, { onDelete: 'cascade' }),
    exercicioId: text('exercicio_id')
      .notNull()
      .references(() => exercicios.id, { onDelete: 'restrict' }),
    ordem: integer('ordem').notNull().default(0),
    series: integer('series').notNull(),
    repsAlvo: text('reps_alvo').notNull(),
    cargaSugeridaKg: numeric('carga_sugerida_kg', { precision: 6, scale: 2 }),
    descansoSegundos: integer('descanso_segundos').notNull().default(60),
    observacao: text('observacao'),
    tipoSerie: tipoSerieEnum('tipo_serie').notNull().default('normal'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
  },
  (t) => [index('exercicios_treino_treino_idx').on(t.treinoId)],
);
