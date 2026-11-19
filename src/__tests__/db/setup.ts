import { sequelize } from "../../db/sequelize.js";

beforeEach(async () => {
  await sequelize.query(
    "TRUNCATE users, companies, list_sources, listings, user_listings RESTART IDENTITY CASCADE",
  );
});

afterAll(async () => {
  await sequelize.close();
});
