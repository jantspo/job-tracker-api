import request from "supertest";
import { createApp } from "../app.js";
import { User } from "../models/index.js";

describe("POST /api/auth/login (db)", () => {
  const app = createApp();

  it("finds a stored user regardless of email case", async () => {
    const user = await User.create({ email: "jane@example.com", passwordHash: "secret-hash" });
    const res = await request(app).post("/api/auth/login").send({ email: "JANE@Example.com" });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ user: { id: user.id, email: "jane@example.com" } });
  });

  it("does not load passwordHash under the default scope", async () => {
    await User.create({ email: "jane@example.com", passwordHash: "secret-hash" });
    const loaded = await User.findOne({ where: { email: "jane@example.com" } });
    expect(loaded?.get("passwordHash")).toBeUndefined();
  });

  it("401s when the email isn't registered", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: "nobody@example.com" });
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Invalid credentials" });
  });
});
