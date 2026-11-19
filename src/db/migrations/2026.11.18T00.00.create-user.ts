import { DataTypes, Sequelize } from "sequelize";
import type { Migration } from "../migrate.js";

export const up: Migration = async ({ context: qi }) => {
  await qi.createTable("users", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    passwordHash: { type: DataTypes.STRING, allowNull: false },
    createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.fn("now") },
    updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.fn("now") },
  });
};

export const down: Migration = async ({ context: qi }) => {
  await qi.dropTable("users");
};
