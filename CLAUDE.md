# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Express 5 + TypeScript API for tracking job listings, resume fit, and application progress (applied → callback → interview → offer). Node 26 (`.nvmrc`), ESM (`"type": "module"`).

## Commands

- `npm run dev` — run from source with `tsx watch` on http://localhost:4000 (loads `.env` if present)
- `npm run build` — compile to `dist/` via `tsconfig.build.json` (excludes tests); `npm start` runs the build
- `npm test` — Vitest in **watch mode**; use `npm run test:run` for a single non-interactive run
- Single test file: `npx vitest run src/__tests__/app.test.ts`; single test by name: `npx vitest run -t "returns 404"`; one project: `npx vitest run --project unit` (or `db`)
- `npm run typecheck`, `npm run lint` (`lint:fix`), `npm run format:check` (`format`)
- `npm run db:migrate` / `db:rollback` (one step; `npm run db:rollback -- --to 0` for all) / `db:status` (pending) — Umzug CLI via `src/db/migrate.ts`; needs `DATABASE_URL`

Before considering a change done, run `npm run typecheck && npm run lint && npm run format:check && npm run test:run`. The same checks run in a husky pre-push hook (`.husky/pre-push`, installed by `npm install` via `prepare`) and in GitHub Actions (`.github/workflows/ci.yml`) on every push and PR. CI then also runs `npm run build` and a smoke test of the built app: it migrates with `dist/db/migrate.js`, starts `dist/server.js`, and checks `/api/health` plus a 400 for malformed JSON on `/login`. Keep that step passing when changing the build, `server.ts`, env vars or startup. The `db` test project needs a reachable Postgres at `TEST_DATABASE_URL`: locally that's your own server (so pushing requires it running); CI provides a `postgres` service container.

## Architecture

- `src/app.ts` exports `createApp()`, which builds the Express app without listening. `src/server.ts` is the only entry point that calls `listen()` (on `env.PORT`, default 4000). Tests import `createApp()` and drive it with Supertest — keep side effects (listening, DB connections) out of `createApp()` or make them injectable so tests stay fast.
- Routes are `Router` instances exported from `src/routes/<name>.ts` (e.g. `healthRouter`) and mounted under `/api/<name>` in `createApp()`. The 404 handler and `errorHandler` must remain the last middleware registered; errors respond with `{ error: string }` JSON.
- Request validation: Zod schemas live in `src/schemas/<name>.ts` and are applied per route with `validate({ body, params, query })` (`src/middleware/validate.ts`). It parses each part in that order (params, query, body; a missing body counts as `{}`), 400s with the first issue's message, and stores the parsed, transformed values on `res.locals.body/params/query`. Handlers read those (cast with `as z.infer<typeof schema>`), never the raw `req` values.
- `errorHandler` (`src/middleware/errorHandler.ts`) takes `err: unknown` and never trusts its shape: JSON parse failures and Sequelize `ValidationError` → 400, `UniqueConstraintError` → 409, other errors with an integer `status`/`statusCode` from 400 to 499 keep it (message only if `expose: true`, otherwise the standard phrase, e.g. `Forbidden`), 500–599 keep the status but say `Internal server error`, and anything else is 500. Only 5xx responses are logged.
- `src/env.ts` parses `process.env` with Zod at import time (`DATABASE_URL` required; `PORT` default 4000; `DB_LOGGING` boolean string, default false) and throws listing every invalid variable. Read config from `env`, not `process.env`; add new variables to `envSchema`. `parseEnv(source)` is exported for tests.
- `src/server.ts` runs `sequelize.authenticate()` before listening and closes the connection on SIGINT/SIGTERM.
- `src/routes/listings.ts` is an empty placeholder, not yet mounted.

### Auth (mocked — demo app)

- `/api/auth` (`authRouter`, `src/routes/auth.ts`) is public; `POST /login` takes `{ email }`, validated and normalized by `loginBody` in `src/schemas/auth.ts` (trim + lowercase; 400 `Invalid or missing email` if absent, `null` or `""`, `Invalid email` if non-string, malformed or over 254 characters), and returns `{ user: { id, email, createdAt }, token }` or 401 `Invalid credentials`. No password check (demo).
- `requireUser` (`src/middleware/requireUser.ts`) expects `Authorization: Bearer <userId>`, loads the `User` into `res.locals.user` (typed via a global `Express.Locals` augmentation), and responds 401 otherwise. It is never applied globally: attach it per router at mount time in `createApp()` (`app.use("/api/listings", requireUser, listingsRouter)`), keeping public routes (health, auth) unwrapped. Handlers behind it can use `res.locals.user!`.
- Token = user id is deliberate mock auth. `src/auth/token.ts` owns it: `issueToken(user)` and `verifyToken(token)` (positive integer id or `null`). Swap those for real verification (e.g. JWT) later without changing callers. `requireUser` still parses the header with its own regex and should move to `verifyToken`.
- `User`'s `defaultScope` excludes `passwordHash`; use `User.scope("withPassword")` when the hash is needed (e.g. a future password check). Never return a raw `User` from an endpoint; pick the public fields.

### Database

- Postgres via Sequelize 6. `src/db/sequelize.ts` builds the singleton from `env.DATABASE_URL`, so importing it (or any model, and therefore `createApp()`) runs `src/env.ts`, which **throws at import time if `DATABASE_URL` is missing or not a URL**. Tests need it set too (the Vitest config sets it per project; see Testing). `DB_LOGGING=true` (or `1`/`yes`/`on`) logs SQL.
- Table names are snake_case (`users`, `companies`, `list_sources`, `listings`, `user_listings`); column names are camelCase, so quote them in raw SQL (`"listSourceId"`).
- Models live in `src/models/<name>.ts` (class + `init()`, using `InferAttributes`/`CreationOptional`/`declare` fields). Associations are defined only in `src/models/index.ts`; import models from there so associations are registered. Model files import each other with `import type` only, to avoid cycles.
- Domain: `Company` and `ListSource` each have many `Listing`s; `User` ↔ `Listing` is many-to-many through `UserListing` (table `user_listings`), which holds resume-fit data (`score`, `adjustedScore`, `fits`, `gaps`, `notes`) and pipeline stages as nullable timestamps (`appliedAt`, `callbackAt`, `interviewAt`, `offerAt`, `rejectedAt` = company rejected, `dismissedAt` + `dismissReason` = user passed). Query `UserListing` with includes as the primary read path.
- Schema is owned by migrations, never `sequelize.sync()`. Migrations in `src/db/migrations/` are named `YYYY.MM.DDTHH.MM.<description>.ts` (run in name order), export `up`/`down` typed as `Migration` from `../migrate.js`, and receive the `QueryInterface` as `context`. `migrate.ts` records names in `SequelizeMeta` **without** the extension, so tsx runs (`.ts`) and the built app (`.js` in `dist/`) share one history; `migrate.db.test.ts` guards this. They copy values rather than importing from models (a migration is a schema snapshot), use Postgres-specific SQL (`now()`, raw `CHECK` constraints), and add explicit indexes on FK columns.
- Validation is layered on purpose: Zod at the request boundary (shape, types, coercion), then model `validate` rules (e.g. `isIn: [WORK_MODES]`, `salaryRange`) plus matching DB `CHECK` constraints for invariants. Schemas reuse the model constants (`z.enum(WORK_MODES)`) rather than copying them. Changing allowed values means updating the model constant **and** adding a new migration that drops/re-adds the constraint.
- `DATEONLY` columns (e.g. `Listing.postDate`) come back as `"YYYY-MM-DD"` strings, not `Date`s.
- Editing already-applied migrations (roll back all, edit, re-migrate) is acceptable only while no shared/deployed database has run them; after that, every schema change is a new migration.

## Testing

`vitest.config.ts` loads `.env` via `process.loadEnvFile()` and defines two projects (shared root options: `globals`, `environment`, `coverage`, `fileParallelism: false`). Don't put `include`/`env` at the root — with `extends: true`, array options are merged into each project, not overridden.

- **`unit`** — `src/**/*.test.ts` excluding `*.db.test.ts`. `DATABASE_URL` is a placeholder (Sequelize doesn't connect until a query runs). Stub model statics with `vi.spyOn(User, "findByPk")` and restore in `afterEach`; never let a unit test reach the database. Middleware (including `validate` and `errorHandler`) is tested by mounting it on a throwaway `express()` app; `app.test.ts` only checks the wiring in `createApp()`.
- **`db`** — `src/**/*.db.test.ts` against a real Postgres at `TEST_DATABASE_URL` (separate `*_test` database, e.g. `job_tracker_test`). `src/__tests__/db/globalSetup.ts` refuses non-`_test` URLs, then runs all migrations once; `src/__tests__/db/setup.ts` `TRUNCATE`s every app table (`RESTART IDENTITY CASCADE`, not `SequelizeMeta`) before each test and closes the connection after. Add new tables to that `TRUNCATE` list. Files run serially because they share one database.
- To reset the test DB after editing migrations: `dropdb job_tracker_test && createdb job_tracker_test`.

## Claude Code setup (`.claude/`)

- Hooks (`.claude/settings.json` → `.claude/hooks/*.sh`, need `jq`): Prettier + ESLint on every edited file (lint errors are fed back), `tsc --noEmit` on Stop when `.ts` files changed, repo state injected at SessionStart, and `protect-files.sh` blocking `.env`/key files. Set `LOCK_MIGRATIONS=true` in `protect-files.sh` once a shared DB has run the migrations.
- Skills: `/new-migration`, `/new-model`, `/new-route`, `/write-tests`, `/api-docs` (`.claude/skills/`).
- Personal overrides go in `.claude/settings.local.json` (gitignored).

## Conventions and gotchas

- `module: nodenext` + `verbatimModuleSyntax`: relative imports must use the `.js` extension (`import { createApp } from "./app.js"`), and type-only imports must use `type` (ESLint enforces inline style: `import { type Request } from "express"`).
- ESLint uses type-aware rules: `no-floating-promises` and `no-misused-promises` are errors, so async route handlers / promises must be awaited or handled. Prefix intentionally unused args with `_`. `eqeqeq` is enforced (`== null` allowed).
- Vitest globals (`describe`, `it`, `expect`, `vi`) are enabled — no need to import them. Tests live in `src/__tests__/` or as `*.test.ts` under `src/`; name DB-backed tests `*.db.test.ts`.
- Prettier: double quotes, semicolons, trailing commas, 100-char width.
