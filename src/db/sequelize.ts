import { Sequelize } from "sequelize";
import { env } from "../env.js";

export const sequelize = new Sequelize(env.DATABASE_URL, {
  logging: env.DB_LOGGING ? console.log : false,
});
