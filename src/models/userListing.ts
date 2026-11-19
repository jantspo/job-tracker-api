import {
  Model,
  DataTypes,
  type InferAttributes,
  type InferCreationAttributes,
  type CreationOptional,
  type ForeignKey,
  type NonAttribute,
  type BelongsToGetAssociationMixin,
} from "sequelize";
import type { User } from "./user.js";
import type { Listing } from "./listing.js";
import { sequelize } from "../db/sequelize.js";

/**
 * A user's relationship to a listing: how well it fits their resume and how far
 * they've gotten in the hiring process. Pipeline stages are nullable timestamps:
 * null means it hasn't happened, a date means when it did.
 */
export class UserListing extends Model<
  InferAttributes<UserListing>,
  InferCreationAttributes<UserListing>
> {
  declare id: CreationOptional<number>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare userId: ForeignKey<User["id"]>;
  declare listingId: ForeignKey<Listing["id"]>;

  declare score: number;
  declare adjustedScore: CreationOptional<number | null>;
  declare fits: CreationOptional<string | null>;
  declare gaps: CreationOptional<string | null>;
  declare notes: CreationOptional<string | null>;

  declare appliedAt: CreationOptional<Date | null>;
  declare callbackAt: CreationOptional<Date | null>;
  declare interviewAt: CreationOptional<Date | null>;
  declare offerAt: CreationOptional<Date | null>;
  /** The company rejected the user */
  declare rejectedAt: CreationOptional<Date | null>;
  /** The user rejected the listing */
  declare dismissedAt: CreationOptional<Date | null>;
  declare dismissReason: CreationOptional<string | null>;

  declare user?: NonAttribute<User>;
  declare getUser: BelongsToGetAssociationMixin<User>;

  declare listing?: NonAttribute<Listing>;
  declare getListing: BelongsToGetAssociationMixin<Listing>;
}

UserListing.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
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
  },
  {
    sequelize,
    tableName: "user_listings",
    indexes: [{ unique: true, fields: ["userId", "listingId"] }, { fields: ["listingId"] }],
  },
);
