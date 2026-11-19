import { defineConfig } from "vitest/config";
try {
  process.loadEnvFile(); // reads ./.env into process.env
} catch {
  // no .env (e.g. CI) — vars come from the environment instead
}

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.{test,spec}.ts", "src/server.ts"],
    },
    fileParallelism: false,
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["src/**/*.test.ts"],
          exclude: ["src/**/*.db.test.ts"],
          env: { DATABASE_URL: "postgres://placeholder@localhost:5432/unused" },
        },
      },
      {
        extends: true,
        test: {
          name: "db",
          include: ["src/**/*.db.test.ts"],
          env: { DATABASE_URL: process.env.TEST_DATABASE_URL ?? "" },
          globalSetup: ["src/__tests__/db/globalSetup.ts"],
          setupFiles: ["src/__tests__/db/setup.ts"],
        },
      },
    ],
  },
});
