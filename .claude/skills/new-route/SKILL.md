---
name: new-route
description: Add an Express Router under src/routes, mount it in createApp() (behind requireUser when protected), and test it with Supertest. Use when adding API endpoints or a new resource.
argument-hint: <resource and endpoints, e.g. "listings: GET /, GET /:id, POST /">
---

Add routes for: $ARGUMENTS

## 1. Router: `src/routes/<name>.ts`

```ts
import { Router } from "express";
import { UserListing } from "../models/index.js";

export const <name>Router = Router();

<name>Router.get("/", async (_req, res) => {
  const user = res.locals.user!; // only when mounted behind requireUser
  // ...
  res.json({ ... });
});
```

- Export a named `<name>Router`. Relative imports end in `.js`; type-only imports use inline `type`.
- Express 5 forwards rejected promises to the error handler, so async handlers need no try/catch for unexpected errors. Do handle **expected** failures explicitly: `400` for bad input, `404` for missing or not-owned rows, with `{ error: string }` bodies.
- Validate and parse params and body yourself (`Number(req.params.id)`, check `Number.isInteger`). Model `validate` errors (`ValidationError`) should become 400, not 500.
- Scope every query to `res.locals.user!.id` on protected routes; never return another user's rows.
- For user-specific listing data, query `UserListing` with `include` (the primary read path), not `Listing` alone.

## 2. Mount it in `src/app.ts`

- Public: `app.use("/api/<name>", <name>Router);`
- Protected: `app.use("/api/<name>", requireUser, <name>Router);`. Attach `requireUser` at mount time, never globally or inside the router.
- Mount **before** the 404 handler and the error handler, which must stay last.
- If this replaces one of the commented-out placeholders in `createApp()`, remove that comment. Update CLAUDE.md if it said the router was unmounted (e.g. "`src/routes/listings.ts` is an empty placeholder").

## 3. Tests

- **Unit** (`src/__tests__/<name>.test.ts`): drive `createApp()` with Supertest. Stub model statics with `vi.spyOn(Model, "findAll")` and similar, and add `afterEach(() => vi.restoreAllMocks())`. For protected routes, also stub `User.findByPk` so `requireUser` passes with `Authorization: Bearer 1`, and assert 401 without it. A unit test must never reach the DB.
- **DB** (`src/__tests__/<name>.db.test.ts`), for real query behavior: seed rows, hit the endpoint, and assert on the response, including that other users' data is excluded.
- Cover the happy path, 400, 404, 401 (if protected), and the response shape.

## 4. Finish

Run `npm run typecheck && npm run lint && npm run format:check && npm run test:run`. Then summarize the new endpoints as `METHOD /api/path → response`.
