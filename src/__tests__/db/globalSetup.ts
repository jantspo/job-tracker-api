export async function setup() {
  const url = process.env.TEST_DATABASE_URL;
  if (!url || !new URL(url).pathname.endsWith("_test")) {
    throw new Error("TEST_DATABASE_URL must point at a *_test database");
  }
  process.env.DATABASE_URL = url; // globalSetup doesn't get the project's `env`
  const { migrator } = await import("../../db/migrate.js");
  await migrator.up();
  const { sequelize } = await import("../../db/sequelize.js");
  await sequelize.close();
}
