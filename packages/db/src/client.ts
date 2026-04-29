import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/index.js';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL não está definido');
}

export const queryClient = postgres(connectionString, {
  prepare: false,
  max: 10,
});

export const db = drizzle(queryClient, { schema, logger: false });

export type Database = typeof db;
