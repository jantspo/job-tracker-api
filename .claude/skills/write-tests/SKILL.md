---
name: write-tests
description: Write Vitest tests for this repo, choosing unit (stubbed, *.test.ts) or DB-backed (*.db.test.ts) correctly and following existing patterns. Use when asked to add tests, increase coverage, or test a specific file/behavior.
argument-hint: <file, function, or behavior to test>
---

Write tests for: $ARGUMENTS

## 1. Pick the right kind

| Testing...                                                                    | Kind     | File                              |
| ----------------------------------------------------------------------------- | -------- | --------------------------------- |
| Route status codes, response shape, auth gating, middleware                   | **unit** | `src/__tests__/<name>.test.ts`    |
| Queries, includes, constraints, model validation hitting Postgres, migrations | **db**   | `src/__tests__/<name>.db.test.ts` |

Prefer unit tests; use db tests when the behavior _is_ the database.

## 2. Unit tests

- Globals (`describe`, `it`, `expect`, `vi`) are enabled, so don't import them.
- Routes: `request(createApp())` via Supertest. Middleware: mount it on a throwaway `express()` app (see `src/__tests__/requireUser.test.ts`).
- Stub model statics: `vi.spyOn(User, "findByPk").mockResolvedValue(User.build({...}))`. Use `Model.build()` for fake instances. Always `afterEach(() => vi.restoreAllMocks())`.
- Never let a unit test reach the DB. If a test hangs or reports a connection error, you missed a stub.

## 3. DB tests

- They run against `TEST_DATABASE_URL`. Every table is TRUNCATEd before each test, so seed what each test needs inside it (or in `beforeEach`).
- Import models from `../models/index.js` so associations are registered.
- To test DB-level CHECK constraints separately from model validation, insert via `sequelize.query(...)` or `Model.create(..., { validate: false })` and expect a rejection.
- `DATEONLY` columns come back as `"YYYY-MM-DD"` strings.

## 4. Quality bar

- One behavior per `it`, named as the behavior ("401s when the user doesn't exist").
- Cover the happy path, each error branch, and edge cases (null and optional fields, boundaries like `salaryMin === salaryMax`).
- Assert exact bodies for errors (`toEqual({ error: "..." })`).
- Don't test Sequelize or Express themselves; test this app's code.

## 5. Run

`npx vitest run <file>` while iterating, then `npm run test:run` (the db project needs Postgres running). Report any failures with their output.
