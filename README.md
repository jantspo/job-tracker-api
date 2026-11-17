# portfolio-node-server

Express 5 + TypeScript API server for the portfolio site.

## Getting started

```bash
nvm use          # Node 26 (see .nvmrc)
npm install
cp .env.example .env   # optional
npm run dev      # http://localhost:4000, restarts on file changes
```

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
