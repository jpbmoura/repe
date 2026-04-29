# Repê

PWA mobile-first para personal trainers e alunos. Personal cria protocolos, aluno executa registrando carga real.

## Stack

- **Frontend** (`apps/web`): Vite + React 18 + TanStack Router + TanStack Query + Tailwind v4 + PWA
- **Backend** (`apps/api`): Express 5 + Better Auth + Drizzle ORM
- **Banco**: Postgres (Railway)
- **Monorepo**: pnpm + Turborepo

## Setup local

```bash
# 1. Instale deps
pnpm install

# 2. Copie envs e preencha
cp .env.example .env

# 3. Aplique schema no banco
pnpm db:push

# 4. Popule a biblioteca de exercícios
pnpm db:seed

# 5. Rode tudo
pnpm dev
```

- API: http://localhost:3001
- Web: http://localhost:5173

## Comandos úteis

```bash
pnpm typecheck      # checa tipos em todos workspaces
pnpm db:generate    # gera migration a partir do schema
pnpm db:push        # aplica schema direto (dev)
pnpm db:studio      # abre Drizzle Studio
pnpm db:seed        # popula biblioteca de exercícios
```

## Estrutura

- `apps/web` — frontend React PWA
- `apps/api` — backend Express
- `packages/db` — schema Drizzle e cliente Postgres
- `packages/shared` — schemas Zod, tipos e lógica pura compartilhada
- `packages/ui` — componentes React reutilizáveis

## Deploy no Railway

O projeto está organizado pra rodar com **3 serviços** em um único projeto Railway:

1. **Postgres** (plugin oficial)
2. **api** — backend Express
3. **web** — Vite build estático servido por `serve`

### Passos

1. **Crie o projeto no Railway** apontando para o repositório do GitHub.

2. **Adicione o Postgres** via "New Service → Database → PostgreSQL". Anote a connection string (ela fica em `${{Postgres.DATABASE_URL}}` para referência).

3. **Crie o serviço `api`**:
   - "New Service → GitHub Repo"
   - Em **Settings → Root Directory**: deixe vazio (a build precisa do monorepo inteiro pra resolver workspaces)
   - Em **Settings → Config-as-code**: aponte para `apps/api/railway.toml`
   - Variáveis de ambiente:
     - `DATABASE_URL` = `${{Postgres.DATABASE_URL}}`
     - `BETTER_AUTH_SECRET` = gere com `openssl rand -base64 32`
     - `BETTER_AUTH_URL` = a URL pública do serviço **api** (ex: `https://repe-api.up.railway.app`)
     - `CORS_ORIGIN` = a URL pública do serviço **web** (ex: `https://repe.up.railway.app`)
     - `NODE_ENV` = `production`
   - Gere domínio público em "Settings → Networking → Generate Domain"
   - Copie a URL — você vai precisar dela para o **web**

4. **Crie o serviço `web`**:
   - "New Service → GitHub Repo" (mesmo repo)
   - Em **Settings → Config-as-code**: aponte para `apps/web/railway.toml`
   - Variáveis de ambiente (precisam estar setadas **antes** do build, porque `VITE_*` são lidas em build time):
     - `VITE_API_URL` = URL pública do serviço **api**
     - `VITE_AUTH_URL` = URL pública do serviço **api**
   - Gere domínio público
   - **Volte no serviço `api`** e atualize `CORS_ORIGIN` com a URL do **web**, depois redeploy a api

5. **Aplique migrations** uma vez (depois do primeiro deploy da api):
   ```bash
   railway run --service api pnpm db:migrate
   ```
   Já é executado automaticamente no `start` (`pnpm --filter @repe/api start` roda `db:migrate` antes do server). Mas se o startCommand falhar antes da app subir, você pode rodar manualmente.

6. **Popule a biblioteca de exercícios** (uma vez):
   ```bash
   railway run --service api pnpm db:seed
   ```

7. **Smoke test**: acesse a URL do **web**, crie um personal, crie um aluno, copie o código, abra `/cadastro?codigo=…` em outra aba/anônima, cadastre o aluno, monte um protocolo e ative.

### Cookies cross-subdomain

Em produção, `api` e `web` ficam em subdomínios diferentes (`*.up.railway.app`). O Better Auth já é configurado pra `sameSite: 'none'` + `secure: true` quando `NODE_ENV=production` (em `apps/api/src/auth.ts`), e o CORS do Express está com `credentials: true` apontando pra `CORS_ORIGIN`. Se as URLs do api/web mudarem, atualize as variáveis de ambiente.

### Geração de migration nova

Quando alterar o schema em `packages/db/src/schema/`, rode:

```bash
pnpm db:generate     # gera SQL em packages/db/migrations/
```

Commitar a migration. No próximo deploy, `db:migrate` aplica automaticamente.

## Aluno x personal

- **Personal**: cria conta em `/cadastro` (sem código). Tem acesso a `/alunos`, `/biblioteca`, editor de protocolos.
- **Aluno**: cadastra em `/cadastro?codigo=…` usando código gerado pelo personal. Cai em `/hoje` com o treino do dia conforme `diasSemana` do protocolo ativo.
