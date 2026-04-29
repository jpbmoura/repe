import dotenvFlow from 'dotenv-flow';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.resolve(__dirname, '../../..');
dotenvFlow.config({ path: monorepoRoot, silent: true });

const envSchema = z.object({
  DATABASE_URL: z.url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url(),
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN: z.url().default('http://localhost:5173'),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('Variáveis de ambiente inválidas:');
  console.error(z.treeifyError(parsed.error));
  process.exit(1);
}

export const env = parsed.data;
