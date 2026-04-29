import { createId } from '@paralleldrive/cuid2';
import { sql } from 'drizzle-orm';
import { date, index, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { user } from './auth.js';
import { alunoStatusEnum, sexoEnum } from './enums.js';

export const alunos = pgTable(
  'alunos',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    personalId: text('personal_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
    nome: text('nome').notNull(),
    email: text('email').notNull(),
    dataNascimento: date('data_nascimento'),
    sexo: sexoEnum('sexo'),
    objetivo: text('objetivo'),
    observacoes: text('observacoes'),
    status: alunoStatusEnum('status').notNull().default('ativo'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
  },
  (t) => [index('alunos_personal_id_idx').on(t.personalId)],
);

export const convitesAluno = pgTable(
  'convites_aluno',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    alunoId: text('aluno_id')
      .notNull()
      .unique()
      .references(() => alunos.id, { onDelete: 'cascade' }),
    codigo: text('codigo').notNull().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .default(sql`now() + interval '30 days'`),
    usadoEm: timestamp('usado_em', { withTimezone: true, mode: 'date' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
  },
  (t) => [index('convites_aluno_codigo_idx').on(t.codigo)],
);
