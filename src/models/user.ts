import {
  Model,
  DataTypes,
  type InferAttributes,
  type InferCreationAttributes,
  type CreationOptional,
  type NonAttribute,
  type Association,
  type HasManyGetAssociationsMixin,
  type BelongsToManyGetAssociationsMixin,
  type BelongsToManyAddAssociationMixin,
  type BelongsToManyHasAssociationMixin,
  type BelongsToManyCountAssociationsMixin,
} from "sequelize";
import type { Listing } from "./listing.js";
import type { UserListing } from "./userListing.js";
import { sequelize } from "../db/sequelize.js";

export class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  declare id: CreationOptional<number>;
  declare email: string;
  declare passwordHash: string;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare listings?: NonAttribute<Listing[]>;
  declare getListings: BelongsToManyGetAssociationsMixin<Listing>;
  /** Pass join-table values via `{ through: { score } }` */
  declare addListing: BelongsToManyAddAssociationMixin<Listing, Listing["id"]>;
  declare hasListing: BelongsToManyHasAssociationMixin<Listing, Listing["id"]>;
  declare countListings: BelongsToManyCountAssociationsMixin;

  declare userListings?: NonAttribute<UserListing[]>;
  declare getUserListings: HasManyGetAssociationsMixin<UserListing>;

  declare static associations: {
    listings: Association<User, Listing>;
    userListings: Association<User, UserListing>;
  };

  async checkPassword(_pw: string) {
    // not really used for portfolio
  }
}

User.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      set(v: string) {
        this.setDataValue("email", v.trim().toLowerCase());
      },
    },
    passwordHash: { type: DataTypes.STRING, allowNull: false },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, tableName: "users" },
);
