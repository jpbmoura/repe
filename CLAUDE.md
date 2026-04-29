# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack & layout

PWA mobile-first pra personal trainers e alunos. Personal cria protocolos de treino; aluno executa registrando carga real.

- **`apps/web`** — Vite + React 18 + TanStack Router (file-based) + TanStack Query + Tailwind v4 + vite-plugin-pwa
- **`apps/api`** — Express 5 + Better Auth + Drizzle (Postgres)
- **`packages/db`** — schema Drizzle, cliente Postgres, migrations, seed
- **`packages/shared`** — schemas Zod, lógica pura (volume, youtube, código de convite)
- **`packages/ui`** — `cn()` helper + `<Logo />` (resto vive em `apps/web/src/components/`)

Monorepo pnpm + Turborepo. Português pt-BR em toda a UI e em nomes de variáveis/colunas.

## Commands

```bash
pnpm dev            # turbo dev em todos os workspaces
pnpm typecheck      # tsc em todos (rode antes de commitar)
pnpm build          # build de produção (web)

# DB (apontando pra DATABASE_URL no .env da raiz)
pnpm db:push        # aplica schema direto — usado em dev/prod (não geramos migrations versionadas)
pnpm db:studio      # Drizzle Studio
pnpm db:seed        # popula biblioteca de exercícios (~52 itens)
pnpm db:generate    # geraria migrations — NÃO use até decidir migrar do push-only

# Filtrar por workspace
pnpm --filter @repe/api typecheck
pnpm --filter @repe/web build
```

`tsr generate` (alias `pnpm --filter @repe/web routes:gen`) gera `apps/web/src/routeTree.gen.ts` a partir dos arquivos em `routes/`. Roda automaticamente em `dev`, `build` e `typecheck` do web. **Não edite o gen manualmente — está no `.gitignore`.**

## Arquitetura — pontos não-óbvios

### Auth: Bearer token + cookie híbrido

iOS Safari/PWA bloqueia cookies cross-site (api e web em domínios diferentes no Railway). Solução híbrida em `apps/api/src/auth.ts` + `apps/web/src/lib/auth-client.ts`:

- Server tem `plugins: [bearer()]`. CORS expõe `set-auth-token`. Rotas custom de cadastro (`apps/api/src/routes/cadastro.ts`) repassam `Set-Cookie` **e** `set-auth-token` da response do Better Auth.
- Client salva `set-auth-token` em `localStorage['repe.bearer_token']` (helper `authStorage`) e envia `Authorization: Bearer X` em toda request via `apps/web/src/lib/api.ts` e via `fetchOptions.auth` do Better Auth.
- Desktop/Android usam o cookie HttpOnly (mais seguro). iOS cai no Bearer. Ambos funcionam simultaneamente — Better Auth aceita cookie OU bearer.
- `signOut` exportado de `auth-client.ts` é wrapper: chama `authClient.signOut()` + limpa o token + `clearSession()`. **Sempre use esse, nunca `authClient.signOut()` direto.**
- Sessão cacheada via TanStack Query (`apps/web/src/lib/session.ts`, `staleTime: 5min`). **`beforeLoad` deve usar `ensureSession()`, nunca `authClient.getSession()` direto** — senão cada navegação refaz fetch e a UI fica lerda. Login/cadastro chamam `invalidateSession()` após sucesso.
- **`invalidateSession()` faz `removeQueries`, não `invalidateQueries`**: `ensureQueryData` (usado no `beforeLoad`) retorna cache stale sem refetch. Se só invalidar, o login aparenta travar — a próxima leitura devolve o `null` do cache pre-login e o `_auth` redireciona pra `/login` de novo. Remover força fetch fresh na próxima.

Detecta produção pelo protocolo da `BETTER_AUTH_URL` (não `NODE_ENV`). Se começa com `https://`, ativa `sameSite: 'none'` + `secure: true` + `useSecureCookies`.

### Express middleware: `personalOnly` por rota, NUNCA `router.use`

Bug clássico já corrigido: `router.use(middleware)` em Express **aplica o middleware a todo request que entra no router**, não só às rotas internas. Como cinco routers são montados em `app.use('/api', X)`, qualquer `/api/*` passava por todos em sequência — `requireRole('personal')` do `alunosRouter` bloqueava o aluno em `/api/aluno/hoje`.

**Padrão obrigatório** ao adicionar rota nova que precisa de role:

```ts
import { personalOnly } from '../middleware/auth.js';

router.get('/foo', ...personalOnly, asyncHandler(...));
```

Há também `alunoOnly`. Para rotas que servem múltiplas roles (como `/api/sessoes`), use `requireAuth` por rota e check de role manual no handler.

### Routing TanStack file-based: `.index.tsx` para rotas com filhos

Outro bug clássico: `_auth.alunos.tsx` (sem `<Outlet/>`) impede `_auth.alunos.$id.tsx` de renderizar — TanStack trata como pai hierárquico. Convenção do repo:

- Rota com filhos → renomear pra `_auth.alunos.index.tsx`
- O arquivo `index.tsx` vira a rota exata (`/alunos`); irmãos `_auth.alunos.$id.index.tsx` viram filhos

Veja `apps/web/src/routes/_auth.alunos.index.tsx`, `_auth.alunos.$id.index.tsx`, `_auth.alunos.$id.protocolos.$pid.tsx`.

### Carregamento de env (monorepo)

`dotenv-flow` lê do `cwd`. Mas o `cwd` quando rodando `tsx` em `apps/api` ou `packages/db` não é a raiz do monorepo. Fix:

- **`packages/db/src/load-env.ts`** aponta `dotenv-flow` pra raiz via `__dirname` resolvido. **Importe-o como primeira linha** em qualquer entry point que precise de env (`migrate.ts`, `seed/run.ts`, `drizzle.config.ts`).
- `apps/api/src/env.ts` faz o mesmo inline (carrega + valida com Zod).
- **Ordem de imports importa** em `server.ts` e `auth.ts`: `import { env }` deve vir **antes** de `@repe/db`, senão `client.ts` lê `process.env.DATABASE_URL` ainda undefined e crasha no top-level.

No frontend, `apps/web/vite.config.ts` tem `envDir: '../..'` pra ler o `.env` da raiz.

### Schema Drizzle 0.45+ + Zod 4 + react-hook-form

- IDs são CUID2 (`@paralleldrive/cuid2`), não UUID.
- Drizzle 0.45 mudou o segundo arg de `pgTable` de objeto pra array — usamos `(t) => [index('...').on(t.x)]`.
- `req.params.X` em Express 5 é `string | string[]` (catchall pode ser array). Use o helper `paramStr(req, 'id')` de `apps/api/src/lib/req.ts`.
- Zod 4: `z.email()` / `z.url()` substituem `z.string().email()` / `.url()`. Para campos opcionais que vêm de inputs HTML (datas vazias `""`), use `z.preprocess(emptyToUndefined, schema.optional())` — vide `packages/shared/src/schemas/aluno.ts`.
- React Hook Form com Zod 4 + `@hookform/resolvers` v5: schemas com `preprocess`/`default` têm Input ≠ Output. Sempre tipar `useForm<TInput, unknown, TOutput>`. Vide `criar-protocolo-dialog.tsx`, `criar-aluno-dialog.tsx`, `criar-exercicio-dialog.tsx`.

### Status de aluno (`treinou` / `atraso`)

`/api/alunos` retorna `treinouHoje` e `emAtraso` calculados. Lógica em `apps/api/src/routes/alunos.ts`:

- `treinouHoje`: existe sessão hoje
- `emAtraso`: tem protocolo ativo + sem sessão hoje + última sessão (ou criação do aluno se nunca treinou) ≥ 3 dias atrás

PRs da semana e demais agregados do personal vêm de `/api/personal/dashboard` (SQL bruto via `db.execute(sql\`...\`)` — Drizzle Query API não cobre os subqueries necessários).

### PR detection

Frontend-side em `apps/web/src/routes/_auth.treino.$sid.tsx`. Compara `cargaKg` da série atual com `ultimaExecucao.cargaKg` que vem de `/api/aluno/hoje` (última série do mesmo `exercicioTreinoId` do aluno). PR no resumo é por exercício (≥1 série superando = 1 PR).

### View Transitions API + animações

- Router tem `defaultViewTransition: true` (cross-fade ~180ms entre rotas, no-op em iOS Safari).
- Stagger fade-in em listas via `[data-stagger-item]` + CSS custom property `--stagger-index`. Cap de ~12 itens pro último delay não atrapalhar.
- Splash screen em HTML estático no `index.html`. `main.tsx` adiciona `body.app-mounted` após primeiro RAF, depois `body.app-splash-done` (some `display: none`).
- `@media (prefers-reduced-motion)` desabilita tudo.

### Deploy Railway

- Cada app tem `start.mjs` próprio (`apps/api/start.mjs`, `apps/web/start.mjs`) chamado por `railway.toml`. **NÃO use `pnpm` no `startCommand`**: o builder Railpack instala pnpm na imagem de build, mas a imagem de runtime não tem. Os scripts `start.mjs` resolvem `tsx`/`serve` diretamente em `node_modules/.bin/`.
- `apps/api/start.mjs` aplica migrations (se `packages/db/migrations/_meta/_journal.json` existir; caso contrário pula — estamos em modo `db:push`, não há migrations geradas).
- `BETTER_AUTH_URL` precisa bater **exatamente** com a URL pública da api. `CORS_ORIGIN` com a URL pública do web. Ambos sem `/` final.
- Variáveis `VITE_*` são lidas em **build time**. Setá-las depois exige redeploy do web.

## Convenções

- **TypeScript estrito**, `noUncheckedIndexedAccess` ligado. Quando indexar arrays/maps, trate `undefined`.
- Nunca `any` exceto com comentário justificando.
- Imports relativos dentro do mesmo workspace, `@repe/*` entre workspaces, `@/*` (alias) dentro de `apps/web/src/`.
- Componentes do app vivem em `apps/web/src/components/` (não em `packages/ui/`). `packages/ui` só para o que é genuinamente compartilhado.
- Sem barrel files exceto na raiz dos packages.
- pt-BR em strings de UI, mensagens de erro de API, e nomes de domínio (alunos, protocolos, sessoesExecutadas, etc).
- Datas: `date-fns` se precisar; persistência em ISO 8601 UTC; render na timezone do usuário.
