import { defineConfig } from "vitest/config";
try {
  process.loadEnvFile(); // reads ./.env into process.env
} catch {
  // no .env (e.g. CI) — vars come from the environment instead
}

// Fixed test values so tests don't depend on whatever is in a local .env.
// JWT_SECRET must be 32+ characters (see envSchema).
const testAuthEnv = {
  JWT_SECRET: "test-secret-do-not-use-in-production-0123456789",
  JWT_EXPIRES_IN: "15m",
};

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
          env: { DATABASE_URL: "postgres://placeholder@localhost:5432/unused", ...testAuthEnv },
        },
      },
      {
        extends: true,
        test: {
          name: "db",
          include: ["src/**/*.db.test.ts"],
          env: { DATABASE_URL: process.env.TEST_DATABASE_URL ?? "", ...testAuthEnv },
          globalSetup: ["src/__tests__/db/globalSetup.ts"],
          setupFiles: ["src/__tests__/db/setup.ts"],
        },
      },
    ],
  },
});
