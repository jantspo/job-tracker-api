import { DataTypes, Sequelize } from "sequelize";
import type { Migration } from "../migrate.js";

export const up: Migration = async ({ context: qi }) => {
  await qi.sequelize.transaction(async (transaction) => {
    await qi.createTable(
      "user_listings",
      {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
        // Deleting a user or a listing removes the user's tracking rows for it.
        userId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: "users", key: "id" },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
        },
        listingId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: "listings", key: "id" },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
        },
        score: { type: DataTypes.INTEGER, allowNull: false },
        adjustedScore: { type: DataTypes.INTEGER, allowNull: true },
        fits: { type: DataTypes.TEXT, allowNull: true },
        gaps: { type: DataTypes.TEXT, allowNull: true },
        notes: { type: DataTypes.TEXT, allowNull: true },
        appliedAt: { type: DataTypes.DATE, allowNull: true },
        callbackAt: { type: DataTypes.DATE, allowNull: true },
        interviewAt: { type: DataTypes.DATE, allowNull: true },
        offerAt: { type: DataTypes.DATE, allowNull: true },
        rejectedAt: { type: DataTypes.DATE, allowNull: true },
        dismissedAt: { type: DataTypes.DATE, allowNull: true },
        dismissReason: { type: DataTypes.TEXT, allowNull: true },
        createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.fn("now") },
        updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.fn("now") },
      },
      { transaction },
    );

    // One row per user per listing. The unique index leads with userId, so it also
    // serves "all of this user's listings" queries; listingId needs its own index.
    await qi.addIndex("user_listings", ["userId", "listingId"], { unique: true, transaction });
    await qi.addIndex("user_listings", ["listingId"], { transaction });
  });
};

export const down: Migration = async ({ context: qi }) => {
  await qi.dropTable("user_listings");
};
