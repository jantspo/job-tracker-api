import { User } from "../models/index.js";

it("lowercases email on save", async () => {
  const u = await User.create({ email: " A@B.com ", passwordHash: "x" });
  expect((await User.findByPk(u.id))?.email).toBe("a@b.com");
});
