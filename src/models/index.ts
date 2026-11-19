import { User } from "./user.js";
import { Listing } from "./listing.js";
import { Company } from "./company.js";
import { ListSource } from "./listSource.js";
import { UserListing } from "./userListing.js";

const companyFk = { name: "companyId", allowNull: false };
Company.hasMany(Listing, { foreignKey: companyFk, as: "listings" });
Listing.belongsTo(Company, { foreignKey: companyFk, as: "company" });

const listSourceFk = { name: "listSourceId", allowNull: false };
ListSource.hasMany(Listing, { foreignKey: listSourceFk, as: "listings" });
Listing.belongsTo(ListSource, { foreignKey: listSourceFk, as: "listSource" });

// User <-> Listing many-to-many through UserListing. The belongsToMany pair gives
// user.getListings() / listing.getUsers(); the hasMany/belongsTo pairs let you query
// UserListing directly with includes, which is the main way to read this data.
const userFk = { name: "userId", allowNull: false };
const listingFk = { name: "listingId", allowNull: false };

User.belongsToMany(Listing, {
  through: UserListing,
  foreignKey: userFk,
  otherKey: listingFk,
  as: "listings",
});
Listing.belongsToMany(User, {
  through: UserListing,
  foreignKey: listingFk,
  otherKey: userFk,
  as: "users",
});

User.hasMany(UserListing, { foreignKey: userFk, as: "userListings" });
UserListing.belongsTo(User, { foreignKey: userFk, as: "user" });

Listing.hasMany(UserListing, { foreignKey: listingFk, as: "userListings" });
UserListing.belongsTo(Listing, { foreignKey: listingFk, as: "listing" });

export { Company, Listing, ListSource, User, UserListing };
