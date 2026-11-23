# job-tracker-api

Express 5 + TypeScript API for tracking job listings, how well they fit your resume, and where each application stands.

## Getting started

```bash
nvm use          # Node 26 (see .nvmrc)
npm install
cp .env.example .env   # then set DATABASE_URL and JWT_SECRET
npm run db:migrate
npm run dev      # http://localhost:4000, restarts on file changes
```

### Environment

| Variable            | Required | Default | Description                                          |
| ------------------- | -------- | ------- | ---------------------------------------------------- |
| `DATABASE_URL`      | yes      | —       | Postgres connection string                           |
| `JWT_SECRET`        | yes      | —       | 32+ character secret for signing login tokens        |
| `JWT_EXPIRES_IN`    | no       | `15m`   | Token lifetime (`15m`, `1h`, `7d`, …)                |
| `PORT`              | no       | `4000`  | HTTP port                                            |
| `DB_LOGGING`        | no       | `false` | Log SQL queries                                      |
| `TEST_DATABASE_URL` | tests    | —       | Separate `*_test` database for the `db` test project |

## Authentication

This is a demo app, so sign-in is simplified on purpose:

- `POST /api/auth/login` with `{ "email": "..." }` returns `{ user, token }` if a user with that email exists. **There is no password check.**
- The token is a JWT (HS256) whose `sub` is the user id and which expires after `JWT_EXPIRES_IN`. Send it as `Authorization: Bearer <token>` on protected routes.
- Tokens are stateless, so they can't be revoked before they expire. Logging out means the client discards the token. The intended frontend (Next.js) keeps it in an `HttpOnly` cookie on its own server and forwards it to this API, so the browser never handles the token.

## Scripts

| Command                                   | Description                                           |
| ----------------------------------------- | ----------------------------------------------------- |
| `npm run dev`                             | Run from source with `tsx watch`; restarts on changes |
| `npm run build`                           | Compile TypeScript to `dist/`                         |
| `npm start`                               | Run the compiled server                               |
| `npm test`                                | Vitest in watch mode                                  |
| `npm run test:run`                        | Run tests once (CI)                                   |
| `npm run test:coverage`                   | Tests with coverage report in `coverage/`             |
| `npm run typecheck`                       | Type-check without emitting                           |
| `npm run lint` / `npm run lint:fix`       | ESLint (type-aware rules) / auto-fix                  |
| `npm run format` / `npm run format:check` | Prettier write / check                                |

## Structure

```
src/
  app.ts          # builds the Express app (imported by tests)
  server.ts       # starts listening — entry point
  routes/         # route modules
  __tests__/      # Vitest + Supertest tests
```
