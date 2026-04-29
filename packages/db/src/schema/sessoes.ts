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
import { exerciciosTreino, treinosProtocolo } from './protocolos.js';

export const sessoesExecutadas = pgTable(
  'sessoes_executadas',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    alunoId: text('aluno_id')
      .notNull()
      .references(() => alunos.id, { onDelete: 'cascade' }),
    treinoId: text('treino_id')
      .notNull()
      .references(() => treinosProtocolo.id, { onDelete: 'restrict' }),
    data: date('data').notNull(),
    horaInicio: timestamp('hora_inicio', { withTimezone: true, mode: 'date' }).notNull(),
    horaFim: timestamp('hora_fim', { withTimezone: true, mode: 'date' }),
    observacaoAluno: text('observacao_aluno'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
  },
  (t) => [index('sessoes_aluno_data_idx').on(t.alunoId, t.data)],
);

export const seriesExecutadas = pgTable(
  'series_executadas',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    sessaoId: text('sessao_id')
      .notNull()
      .references(() => sessoesExecutadas.id, { onDelete: 'cascade' }),
    exercicioTreinoId: text('exercicio_treino_id')
      .notNull()
      .references(() => exerciciosTreino.id, { onDelete: 'restrict' }),
    numeroSerie: integer('numero_serie').notNull(),
    repsFeitas: integer('reps_feitas').notNull(),
    cargaKg: numeric('carga_kg', { precision: 6, scale: 2 }).notNull(),
    concluidoEm: timestamp('concluido_em', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
  },
  (t) => [index('series_sessao_idx').on(t.sessaoId)],
);
