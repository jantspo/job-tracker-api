# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Express 5 + TypeScript API for tracking job listings, resume fit, and application progress (applied → callback → interview → offer). Node 26 (`.nvmrc`), ESM (`"type": "module"`).

## Commands

- `npm run dev` — run from source with `tsx watch` on http://localhost:4000 (loads `.env` if present)
- `npm run build` — compile to `dist/` via `tsconfig.build.json` (excludes tests); `npm start` runs the build
- `npm test` — Vitest in **watch mode**; use `npm run test:run` for a single non-interactive run
- Single test file: `npx vitest run src/__tests__/app.test.ts`; single test by name: `npx vitest run -t "returns 404"`
- `npm run typecheck`, `npm run lint` (`lint:fix`), `npm run format:check` (`format`)
- `npm run db:migrate` / `db:rollback` (one step) / `db:status` (pending) — Umzug CLI via `src/db/migrate.ts`; needs `DATABASE_URL`

Before considering a change done, run `npm run typecheck && npm run lint && npm run format:check && npm run test:run`. The same checks run in a husky pre-push hook (`.husky/pre-push`, installed by `npm install` via `prepare`) and in GitHub Actions (`.github/workflows/ci.yml`) on every push and PR. CI has no database, so tests must not require `DATABASE_URL` unless the workflow gains a Postgres service.

## Architecture

- `src/app.ts` exports `createApp()`, which builds the Express app without listening. `src/server.ts` is the only entry point that calls `listen()` (reads `PORT`, default 4000). Tests import `createApp()` and drive it with Supertest — keep side effects (listening, DB connections) out of `createApp()` or make them injectable so tests stay fast.
- Routes are `Router` instances exported from `src/routes/<name>.ts` (e.g. `healthRouter`) and mounted under `/api/<name>` in `createApp()`. The 404 handler and error handler must remain the last middleware registered; errors respond with `{ error: string }` JSON.
- `src/server.ts` runs `sequelize.authenticate()` before listening and closes the connection on SIGINT/SIGTERM.
- `src/routes/listings.ts` is an empty placeholder, not yet mounted.

### Database

- Postgres via Sequelize 6. `src/db/sequelize.ts` builds the singleton from `DATABASE_URL` and **throws at import time if it's unset**, so anything importing models (and therefore `createApp()` once routes use them) needs `DATABASE_URL` set, including in tests. `DB_LOGGING=true` logs SQL.
- Models live in `src/models/<name>.ts` (class + `init()`, using `InferAttributes`/`CreationOptional`/`declare` fields). Associations are defined only in `src/models/index.ts`; import models from there so associations are registered. Model files import each other with `import type` only, to avoid cycles.
- Domain: `Company` and `ListSource` each have many `Listing`s; `User` ↔ `Listing` is many-to-many through `UserListing` (table `user_listings`), which holds resume-fit data (`score`, `adjustedScore`, `fits`, `gaps`, `notes`) and pipeline stages as nullable timestamps (`appliedAt`, `callbackAt`, `interviewAt`, `offerAt`, `rejectedAt` = company rejected, `dismissedAt` + `dismissReason` = user passed). Query `UserListing` with includes as the primary read path.
- Schema is owned by migrations, never `sequelize.sync()`. Migrations in `src/db/migrations/` are named `YYYY.MM.DDTHH.MM.<description>.ts` (run in name order), export `up`/`down` typed as `Migration` from `../migrate.js`, and receive the `QueryInterface` as `context`. They copy values rather than importing from models (a migration is a schema snapshot), use Postgres-specific SQL (`now()`, raw `CHECK` constraints), and add explicit indexes on FK columns.
- Validation is duplicated on purpose: model `validate` rules (e.g. `isIn: [WORK_MODES]`, `salaryRange`) plus matching DB `CHECK` constraints. Changing allowed values means updating the model constant **and** adding a new migration that drops/re-adds the constraint.
- `DATEONLY` columns (e.g. `Listing.postDate`) come back as `"YYYY-MM-DD"` strings, not `Date`s.

## Conventions and gotchas

- `module: nodenext` + `verbatimModuleSyntax`: relative imports must use the `.js` extension (`import { createApp } from "./app.js"`), and type-only imports must use `type` (ESLint enforces inline style: `import { type Request } from "express"`).
- ESLint uses type-aware rules: `no-floating-promises` and `no-misused-promises` are errors, so async route handlers / promises must be awaited or handled. Prefix intentionally unused args with `_`. `eqeqeq` is enforced (`== null` allowed).
- Vitest globals (`describe`, `it`, `expect`) are enabled — no need to import them. Tests live in `src/__tests__/` or as `*.test.ts` under `src/`.
- Prettier: double quotes, semicolons, trailing commas, 100-char width.
