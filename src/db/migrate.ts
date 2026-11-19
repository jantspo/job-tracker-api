import { Umzug, SequelizeStorage } from "umzug";
import { sequelize } from "./sequelize.js";

export const migrator = new Umzug({
  migrations: { glob: ["migrations/*.{ts,js}", { cwd: import.meta.dirname }] },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize }),
  logger: console,
});

export type Migration = typeof migrator._types.migration;

if (import.meta.main) {
  await migrator.runAsCLI();
}
