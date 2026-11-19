---
name: new-model
description: Add a new Sequelize model and its table end to end (model file, associations, migration, test TRUNCATE list, tests, CLAUDE.md). Use when the user wants a new entity/table in the domain.
argument-hint: <ModelName and its fields/relations>
---

Add a model for: $ARGUMENTS

Do every step. The checklist at the end is what usually gets missed.

## 1. Migration

Follow the `new-migration` skill to create the table (snake_case plural table name, FK indexes, CHECK constraints for enumerations/ranges).

## 2. Model file: `src/models/<camelName>.ts`

Copy the pattern from `src/models/company.ts`:

- `class X extends Model<InferAttributes<X>, InferCreationAttributes<X>>` with `declare` fields; `CreationOptional` for `id`, `createdAt`, `updatedAt`, and anything with a DB default.
- Association fields and mixins are `declare`d with `NonAttribute<...>` and the `HasMany*` / `BelongsTo*` mixin types.
- Import other models with **`import type` only** (avoids import cycles), plus `sequelize` from `../db/sequelize.js`.
- `X.init({...}, { sequelize, tableName: "<snake_table>" })`.
- Mirror every DB CHECK as a `validate` rule; export allowed-value constants (`export const FOO_KINDS = [...] as const`) and their types.

## 3. Associations: `src/models/index.ts` only

- Define both directions (`hasMany` + `belongsTo`, or `belongsToMany` pairs through a join model), sharing a `{ name, allowNull: false }` foreignKey object and explicit `as` aliases.
- Add the model to the `export { ... }` list. Code imports models from `models/index.js`, never from the individual files.

## 4. Tests

- Add the table to the `TRUNCATE` list in `src/__tests__/db/setup.ts`.
- Add `src/__tests__/<camelName>.db.test.ts` covering create, validation failures, and each association include.

## 5. Docs

Update CLAUDE.md > Database: the table list and the "Domain" line, if relationships changed.

## Checklist

- [ ] migration created and round-tripped (migrate → rollback → migrate)
- [ ] model file with `import type` for other models
- [ ] associations + export in `models/index.ts`
- [ ] table added to TRUNCATE in `src/__tests__/db/setup.ts`
- [ ] `.db.test.ts` added
- [ ] CLAUDE.md updated
- [ ] `npm run typecheck && npm run lint && npm run format:check && npm run test:run`
