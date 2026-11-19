import {
  Model,
  DataTypes,
  type InferAttributes,
  type InferCreationAttributes,
  type CreationOptional,
  type ForeignKey,
  type NonAttribute,
  type BelongsToGetAssociationMixin,
  type BelongsToManyGetAssociationsMixin,
  type HasManyGetAssociationsMixin,
} from "sequelize";
import type { User } from "./user.js";
import type { Company } from "./company.js";
import type { ListSource } from "./listSource.js";
import type { UserListing } from "./userListing.js";
import { sequelize } from "../db/sequelize.js";

export const WORK_MODES = ["remote", "on-site", "hybrid"] as const;
export type WorkMode = (typeof WORK_MODES)[number];

export const SALARY_PERIODS = ["year", "hour"] as const;
export type SalaryPeriod = (typeof SALARY_PERIODS)[number];

export class Listing extends Model<InferAttributes<Listing>, InferCreationAttributes<Listing>> {
  declare id: CreationOptional<number>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare title: string;
  declare workMode: WorkMode;
  declare location: CreationOptional<string | null>;
  declare salaryMin: CreationOptional<number | null>;
  declare salaryMax: CreationOptional<number | null>;
  declare salaryCurrency: CreationOptional<string | null>;
  declare salaryPeriod: CreationOptional<SalaryPeriod | null>;
  /** null = not mentioned in the posting */
  declare relocation: CreationOptional<boolean | null>;
  /** DATEONLY: Sequelize returns "YYYY-MM-DD" strings, not Date objects */
  declare postDate: CreationOptional<string | null>;
  declare applicationUrl: string;

  declare companyId: ForeignKey<Company["id"]>;
  declare listSourceId: ForeignKey<ListSource["id"]>;

  declare company?: NonAttribute<Company>;
  declare getCompany: BelongsToGetAssociationMixin<Company>;

  declare listSource?: NonAttribute<ListSource>;
  declare getListSource: BelongsToGetAssociationMixin<ListSource>;

  declare users?: NonAttribute<User[]>;
  declare getUsers: BelongsToManyGetAssociationsMixin<User>;

  declare userListings?: NonAttribute<UserListing[]>;
  declare getUserListings: HasManyGetAssociationsMixin<UserListing>;
}

Listing.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
    title: { type: DataTypes.STRING, allowNull: false },
    workMode: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { isIn: [WORK_MODES] },
    },
    location: { type: DataTypes.STRING, allowNull: true },
    salaryMin: { type: DataTypes.INTEGER, allowNull: true, validate: { min: 0 } },
    salaryMax: { type: DataTypes.INTEGER, allowNull: true, validate: { min: 0 } },
    salaryCurrency: { type: DataTypes.STRING(3), allowNull: true },
    salaryPeriod: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: { isIn: [SALARY_PERIODS] },
    },
    relocation: { type: DataTypes.BOOLEAN, allowNull: true },
    postDate: { type: DataTypes.DATEONLY, allowNull: true },
    applicationUrl: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true,
      validate: { isUrl: true },
    },
  },
  {
    sequelize,
    tableName: "listings",
    validate: {
      salaryRange(this: Listing) {
        if (this.salaryMin != null && this.salaryMax != null && this.salaryMin > this.salaryMax) {
          throw new Error("salaryMin cannot be greater than salaryMax");
        }
      },
    },
  },
);
