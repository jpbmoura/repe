import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.resolve(__dirname, '../..');

const candidatos = [
  path.join(monorepoRoot, 'apps/api/node_modules/.bin/tsx'),
  path.join(monorepoRoot, 'node_modules/.bin/tsx'),
  path.join(monorepoRoot, 'packages/db/node_modules/.bin/tsx'),
];

const tsxBin = candidatos.find((p) => existsSync(p));
if (!tsxBin) {
  console.error('tsx não encontrado em nenhum dos paths esperados:');
  for (const p of candidatos) console.error(' -', p);
  process.exit(1);
}

const migrationsDir = path.join(monorepoRoot, 'packages/db/migrations');
const migrateScript = path.join(monorepoRoot, 'packages/db/src/migrate.ts');
const serverScript = path.join(monorepoRoot, 'apps/api/src/server.ts');

function run(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(tsxBin, args, {
      stdio: 'inherit',
      cwd: monorepoRoot,
      env: process.env,
    });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Comando "${args.join(' ')}" terminou com código ${code}`));
    });
  });
}

if (existsSync(path.join(migrationsDir, 'meta', '_journal.json'))) {
  console.log('[start] aplicando migrations…');
  await run([migrateScript]);
} else {
  console.log(
    '[start] nenhuma migration encontrada em packages/db/migrations — pulando.',
  );
  console.log(
    '[start] aplique o schema com `pnpm db:push` apontando para o DATABASE_URL de produção,',
  );
  console.log(
    '[start] ou gere migrations com `pnpm db:generate` e faça commit.',
  );
}

console.log('[start] iniciando servidor…');
await run([serverScript]);
