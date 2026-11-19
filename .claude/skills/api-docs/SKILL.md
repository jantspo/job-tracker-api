---
name: api-docs
description: Generate or refresh the API endpoint reference (docs/API.md and the README endpoint table) from the actual routers mounted in createApp(). Use when endpoints change or the user asks for API documentation.
---

Document the API from the code, not from memory.

## 1. Collect endpoints

1. Read `src/app.ts` and list every `app.use("/api/...", [requireUser,] router)` mount. Note which are behind `requireUser`.
2. For each router in `src/routes/`, list every `router.<method>(path, ...)` with its full path, `/api/<mount>` + `path`.
3. For each handler, determine:
   - params, query, and body fields, with their types and whether they're required
   - success status and response shape (use the model attributes in `src/models/` for field types; `DATEONLY` fields are `"YYYY-MM-DD"` strings)
   - error statuses and their `{ error }` messages
   - auth: `Authorization: Bearer <userId>` (mock auth) or public

Skip stubbed handlers (e.g. `501 Not implemented`), or list them marked _not implemented_.

## 2. Write `docs/API.md`

- An intro with the base URL `http://localhost:4000`, the auth scheme, and the error format `{ "error": string }`.
- One section per resource. For each endpoint: `METHOD /path`, auth, a params/body table, an example request (`curl`), an example response, and its errors.
- Use realistic example data that matches the model validations (e.g. `workMode` is one of `remote`, `on-site`, `hybrid`).

## 3. README

Add or update an **Endpoints** table in `README.md` (Method | Path | Auth | Description) linking to `docs/API.md`. Match the README's existing table style.

## 4. Finish

Run `npm run format` (Prettier formats Markdown), then `npm run format:check`. Tell the user which endpoints were added, changed, or removed compared with the previous docs.
