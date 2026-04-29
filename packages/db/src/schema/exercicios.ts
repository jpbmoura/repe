import { createId } from '@paralleldrive/cuid2';
import { index, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { user } from './auth.js';
import {
  categoriaExercicioEnum,
  equipamentoEnum,
  escopoExercicioEnum,
  grupoMuscularEnum,
  padraoMovimentoEnum,
} from './enums.js';

export const exercicios = pgTable(
  'exercicios',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    nome: text('nome').notNull(),
    slug: text('slug').notNull().unique(),
    grupoMuscularPrimario: grupoMuscularEnum('grupo_muscular_primario').notNull(),
    gruposSecundarios: grupoMuscularEnum('grupos_secundarios')
      .array()
      .notNull()
      .default([]),
    equipamento: equipamentoEnum('equipamento').notNull(),
    categoria: categoriaExercicioEnum('categoria').notNull(),
    padraoMovimento: padraoMovimentoEnum('padrao_movimento'),
    youtubeUrl: text('youtube_url'),
    youtubeId: text('youtube_id'),
    instrucoes: text('instrucoes'),
    escopo: escopoExercicioEnum('escopo').notNull().default('publico'),
    criadoPor: text('criado_por').references(() => user.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
  },
  (t) => [index('exercicios_escopo_criador_idx').on(t.escopo, t.criadoPor)],
);
