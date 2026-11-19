import { DataTypes, Sequelize } from "sequelize";
import type { Migration } from "../migrate.js";

// Values are copied (not imported) from the model on purpose: a migration is a
// snapshot of the schema at this point in time. Changing the allowed values later
// means a new migration that drops and re-adds the CHECK constraint.
export const up: Migration = async ({ context: qi }) => {
  await qi.sequelize.transaction(async (transaction) => {
    await qi.createTable(
      "listings",
      {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
        title: { type: DataTypes.STRING, allowNull: false },
        workMode: { type: DataTypes.STRING, allowNull: false },
        location: { type: DataTypes.STRING, allowNull: true },
        salaryMin: { type: DataTypes.INTEGER, allowNull: true },
        salaryMax: { type: DataTypes.INTEGER, allowNull: true },
        salaryCurrency: { type: DataTypes.STRING(3), allowNull: true },
        salaryPeriod: { type: DataTypes.STRING, allowNull: true },
        relocation: { type: DataTypes.BOOLEAN, allowNull: true },
        postDate: { type: DataTypes.DATEONLY, allowNull: true },
        applicationUrl: { type: DataTypes.TEXT, allowNull: false, unique: true },
        companyId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: "companies", key: "id" },
          onUpdate: "CASCADE",
          // A company with listings can't be deleted until its listings are removed.
          onDelete: "RESTRICT",
        },
        listSourceId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: "list_sources", key: "id" },
          onUpdate: "CASCADE",
          onDelete: "RESTRICT",
        },
        createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.fn("now") },
        updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.fn("now") },
      },
      { transaction },
    );

    // Postgres doesn't index foreign key columns automatically.
    await qi.addIndex("listings", ["companyId"], { transaction });
    await qi.addIndex("listings", ["listSourceId"], { transaction });

    await qi.sequelize.query(
      `ALTER TABLE "listings"
         ADD CONSTRAINT "listings_work_mode_check"
           CHECK ("workMode" IN ('remote', 'on-site', 'hybrid')),
         ADD CONSTRAINT "listings_salary_period_check"
           CHECK ("salaryPeriod" IS NULL OR "salaryPeriod" IN ('year', 'hour')),
         ADD CONSTRAINT "listings_salary_nonnegative_check"
           CHECK (("salaryMin" IS NULL OR "salaryMin" >= 0) AND ("salaryMax" IS NULL OR "salaryMax" >= 0)),
         ADD CONSTRAINT "listings_salary_range_check"
           CHECK ("salaryMin" IS NULL OR "salaryMax" IS NULL OR "salaryMin" <= "salaryMax")`,
      { transaction },
    );
  });
};

export const down: Migration = async ({ context: qi }) => {
  await qi.dropTable("listings");
};
