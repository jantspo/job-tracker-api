import { readdir } from "node:fs/promises";
import { migrator } from "../db/migrate.js";
import { sequelize } from "../db/sequelize.js";

// globalSetup has already run `migrator.up()` against the test database.
describe("migrator", () => {
  const migrationNames = async () =>
    (await readdir(new URL("../db/migrations/", import.meta.url)))
      .filter((file) => /\.(ts|js)$/.test(file))
      .map((file) => file.replace(/\.(ts|js)$/, ""))
      .sort();

  it("records migrations in SequelizeMeta without a file extension", async () => {
    // Regression: names used to include .ts/.js, so tsx and the compiled build
    // each treated the other's migrations as pending and re-ran them.
    const [rows] = await sequelize.query('SELECT name FROM "SequelizeMeta" ORDER BY name');
    const names = (rows as { name: string }[]).map((row) => row.name);
    expect(names).toEqual(await migrationNames());
  });

  it("reports executed migrations by extensionless name", async () => {
    const executed = (await migrator.executed()).map((m) => m.name);
    expect(executed).toEqual(await migrationNames());
  });

  it("has nothing pending after the initial run", async () => {
    expect(await migrator.pending()).toEqual([]);
  });
});
