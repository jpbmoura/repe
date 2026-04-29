import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.resolve(__dirname, '../..');

const candidatos = [
  path.join(monorepoRoot, 'apps/web/node_modules/.bin/serve'),
  path.join(monorepoRoot, 'node_modules/.bin/serve'),
];

const serveBin = candidatos.find((p) => existsSync(p));
if (!serveBin) {
  console.error('serve não encontrado em nenhum dos paths esperados:');
  for (const p of candidatos) console.error(' -', p);
  process.exit(1);
}

const port = process.env.PORT ?? '5173';
const distPath = path.join(monorepoRoot, 'apps/web/dist');

if (!existsSync(distPath)) {
  console.error('dist não encontrado em', distPath);
  console.error('O build do web rodou? Rode pnpm --filter @repe/web build antes.');
  process.exit(1);
}

console.log(`[start] servindo ${distPath} em http://0.0.0.0:${port}`);

const child = spawn(serveBin, ['-s', distPath, '-l', port], {
  stdio: 'inherit',
  cwd: monorepoRoot,
  env: process.env,
});

child.on('error', (err) => {
  console.error('[start] erro ao iniciar serve:', err);
  process.exit(1);
});

child.on('exit', (code) => process.exit(code ?? 0));

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => child.kill(sig));
}
