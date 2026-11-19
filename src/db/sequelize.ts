import { Sequelize } from "sequelize";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");

export const sequelize = new Sequelize(url, {
  logging: process.env.DB_LOGGING === "true" ? console.log : false,
});
