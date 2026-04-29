import dotenvFlow from 'dotenv-flow';
import { defineConfig } from 'drizzle-kit';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.resolve(__dirname, '../..');
dotenvFlow.config({ path: monorepoRoot, silent: true });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL não está definido. Crie um .env com DATABASE_URL na raiz.');
}

export default defineConfig({
  schema: './src/schema/index.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: { url: databaseUrl },
  verbose: true,
  strict: true,
});
