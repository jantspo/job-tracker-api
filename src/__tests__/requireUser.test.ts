import express from "express";
import request from "supertest";
import { requireUser } from "../middleware/requireUser.js";
import { User } from "../models/index.js";

describe("requireUser", () => {
  const app = express();
  app.get("/protected", requireUser, (_req, res) => {
    res.json({ userId: res.locals.user?.id });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("401s without an Authorization header", async () => {
    const res = await request(app).get("/protected");
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Authentication required" });
  });

  it("401s for a malformed token", async () => {
    const res = await request(app).get("/protected").set("Authorization", "Bearer abc");
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Authentication required" });
  });

  it("401s when the user doesn't exist", async () => {
    vi.spyOn(User, "findByPk").mockResolvedValue(null);
    const res = await request(app).get("/protected").set("Authorization", "Bearer 99");
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Invalid token" });
  });

  it("loads the user into res.locals and calls next", async () => {
    const findByPk = vi
      .spyOn(User, "findByPk")
      .mockResolvedValue(User.build({ id: 7, email: "a@b.com", passwordHash: "x" }));
    const res = await request(app).get("/protected").set("Authorization", "Bearer 7");
    expect(findByPk).toHaveBeenCalledWith(7);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ userId: 7 });
  });
});
