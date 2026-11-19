---
name: new-migration
description: Create a new Umzug/Sequelize migration in src/db/migrations following this repo's conventions (naming, up/down, CHECK constraints, FK indexes) and keep the matching model in sync. Use when adding, changing, or dropping a table, column, index, or constraint.
argument-hint: <what the migration does, e.g. "add url column to companies">
---

Create a migration for: $ARGUMENTS

## 1. Name the file

- Path: `src/db/migrations/YYYY.MM.DDTHH.MM.<kebab-description>.ts`, using the current UTC time (`date -u +%Y.%m.%dT%H.%M`).
- List the directory first. The new name must sort **after** every existing file, because migrations run in name order.
- Never edit an existing migration unless the user confirms no shared/deployed DB has run it (see CLAUDE.md > Database).

## 2. Write it

```ts
import { DataTypes, Sequelize } from "sequelize";
import type { Migration } from "../migrate.js";

export const up: Migration = async ({ context: qi }) => {
  await qi.sequelize.transaction(async (transaction) => {
    // createTable / addColumn / addIndex / raw SQL, each with { transaction }
  });
};

export const down: Migration = async ({ context: qi }) => {
  // exact inverse of up, in reverse order
};
```

Rules:

- **Copy values, don't import models or model constants.** A migration is a schema snapshot. Add a comment saying so when copying allowed values.
- Tables are snake_case, columns camelCase. Quote columns in raw SQL (`"listSourceId"`).
- New tables get `id` (INTEGER autoIncrement PK, `allowNull: false`) and `createdAt`/`updatedAt` with `defaultValue: Sequelize.fn("now")`, `allowNull: false`.
- FK columns: `references: { model: "<table>", key: "id" }`, explicit `onUpdate`/`onDelete`, plus an explicit `qi.addIndex(table, [col])` (Postgres doesn't index FKs).
- Enumerated values and ranges get a raw `CHECK` constraint named `<table>_<column>_check`. Changing allowed values means `DROP CONSTRAINT` and re-`ADD` in a new migration.
- Use Postgres-specific SQL freely (`now()`, `CHECK`, partial indexes).
- `down` must fully reverse `up`. Dropping a table drops its indexes and constraints; for column changes, reverse each step.

## 3. Keep the model in sync

Update `src/models/<name>.ts` so the model matches: `declare` field, `init()` attribute, and `validate` rules mirroring each new CHECK (e.g. `isIn: [CONSTANT]`, `min: 0`). Update exported constants such as `WORK_MODES` when allowed values change.

For a **new table**, follow the `new-model` skill as well (associations in `models/index.ts`, the TRUNCATE list in `src/__tests__/db/setup.ts`, CLAUDE.md).

## 4. Verify

1. `npm run db:status` shows the new migration pending.
2. On the dev DB: `npm run db:migrate`, then `npm run db:rollback`, then `npm run db:migrate`. This proves `down` works.
3. If you changed migrations the test DB already ran, reset it: `dropdb job_tracker_test && createdb job_tracker_test`.
4. Add or extend a `*.db.test.ts` that exercises the new constraint (valid insert succeeds; invalid insert rejects at the model **and** the DB level, e.g. via `sequelize.query` bypassing validation).
5. Run `npm run typecheck && npm run lint && npm run format:check && npm run test:run`.
