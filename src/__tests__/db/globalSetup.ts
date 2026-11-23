import { type TestProject } from "vitest/node";

export async function setup(project: TestProject) {
  const url = process.env.TEST_DATABASE_URL;
  if (!url || !new URL(url).pathname.endsWith("_test")) {
    throw new Error("TEST_DATABASE_URL must point at a *_test database");
  }
  // globalSetup runs in the main process, which doesn't get the project's `env`
  // (DATABASE_URL, JWT_SECRET, ...), so copy it in before importing anything that loads env.ts.
  Object.assign(process.env, project.config.env);
  const { migrator } = await import("../../db/migrate.js");
  await migrator.up();
  const { sequelize } = await import("../../db/sequelize.js");
  await sequelize.close();
}
