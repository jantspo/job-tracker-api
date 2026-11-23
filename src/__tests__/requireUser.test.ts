import express from "express";
import request from "supertest";
import { SignJWT } from "jose";
import { requireUser } from "../middleware/requireUser.js";
import { issueToken } from "../auth/token.js";
import { User } from "../models/index.js";

describe("requireUser", () => {
  const app = express();
  app.get("/protected", requireUser, (_req, res) => {
    res.json({ userId: res.locals.user?.id });
  });

  const user = () => User.build({ id: 7, email: "a@b.com", passwordHash: "x" });
  const get = (authorization?: string) => {
    const req = request(app).get("/protected");
    return authorization === undefined ? req : req.set("Authorization", authorization);
  };

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("401 Authentication required", () => {
    it.each([
      ["no Authorization header", undefined],
      ["an empty header", ""],
      ["a non-Bearer scheme", "Basic dXNlcjpwYXNz"],
      ["Bearer with no token", "Bearer "],
      ["a token containing spaces", "Bearer abc def"],
    ])("for %s", async (_label, authorization) => {
      const findByPk = vi.spyOn(User, "findByPk");
      const res = await get(authorization);
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: "Authentication required" });
      expect(findByPk).not.toHaveBeenCalled();
    });
  });

  describe("401 Invalid token, without querying", () => {
    it("for the old mock token (a bare user id)", async () => {
      const findByPk = vi.spyOn(User, "findByPk");
      const res = await get("Bearer 7");
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: "Invalid token" });
      expect(findByPk).not.toHaveBeenCalled();
    });

    it("for a non-JWT string", async () => {
      const findByPk = vi.spyOn(User, "findByPk");
      const res = await get("Bearer abc");
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: "Invalid token" });
      expect(findByPk).not.toHaveBeenCalled();
    });

    it("for a token signed with a different secret", async () => {
      const findByPk = vi.spyOn(User, "findByPk");
      const forged = await new SignJWT({})
        .setProtectedHeader({ alg: "HS256" })
        .setSubject("7")
        .setIssuedAt()
        .setExpirationTime("15m")
        .sign(new TextEncoder().encode("some-other-secret-that-is-32-chars-long!"));
      const res = await get(`Bearer ${forged}`);
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: "Invalid token" });
      expect(findByPk).not.toHaveBeenCalled();
    });

    it("for an expired token", async () => {
      const findByPk = vi.spyOn(User, "findByPk");
      const token = await issueToken(user());
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(Date.now() + 16 * 60 * 1000);
      try {
        const res = await get(`Bearer ${token}`);
        expect(res.status).toBe(401);
        expect(res.body).toEqual({ error: "Invalid token" });
      } finally {
        vi.useRealTimers();
      }
      expect(findByPk).not.toHaveBeenCalled();
    });
  });

  it("401s with Invalid token when a valid token's user no longer exists", async () => {
    const findByPk = vi.spyOn(User, "findByPk").mockResolvedValue(null);
    const res = await get(`Bearer ${await issueToken(user())}`);
    expect(findByPk).toHaveBeenCalledWith(7);
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Invalid token" });
  });

  it("loads the user into res.locals and calls next", async () => {
    const findByPk = vi.spyOn(User, "findByPk").mockResolvedValue(user());
    const res = await get(`Bearer ${await issueToken(user())}`);
    expect(findByPk).toHaveBeenCalledWith(7);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ userId: 7 });
  });

  it("accepts a lowercase bearer scheme", async () => {
    vi.spyOn(User, "findByPk").mockResolvedValue(user());
    const res = await get(`bearer ${await issueToken(user())}`);
    expect(res.status).toBe(200);
  });
});
