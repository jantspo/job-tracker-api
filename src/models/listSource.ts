import {
  Model,
  DataTypes,
  type InferAttributes,
  type InferCreationAttributes,
  type CreationOptional,
  type NonAttribute,
  type Association,
  type HasManyGetAssociationsMixin,
  type HasManyCreateAssociationMixin,
  type HasManyCountAssociationsMixin,
} from "sequelize";
import type { Listing } from "./listing.js";
import { sequelize } from "../db/sequelize.js";

export class ListSource extends Model<
  InferAttributes<ListSource>,
  InferCreationAttributes<ListSource>
> {
  declare id: CreationOptional<number>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare name: string;
  declare listings?: NonAttribute<Listing[]>;
  declare getListings: HasManyGetAssociationsMixin<Listing>;
  declare createListing: HasManyCreateAssociationMixin<Listing, "listSourceId">;
  declare countListings: HasManyCountAssociationsMixin;

  declare static associations: { listings: Association<ListSource, Listing> };
}

ListSource.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
    name: { type: DataTypes.STRING, allowNull: false, unique: true },
  },
  { sequelize, tableName: "listSources" },
);
