import dotenvFlow from 'dotenv-flow';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.resolve(__dirname, '../../..');
dotenvFlow.config({ path: monorepoRoot, silent: true });
