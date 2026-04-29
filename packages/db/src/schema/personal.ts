import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { user } from './auth.js';

export const personalProfiles = pgTable('personal_profiles', {
  userId: text('user_id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  bio: text('bio'),
  especialidade: text('especialidade'),
  fotoUrl: text('foto_url'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
    .notNull()
    .defaultNow(),
});
