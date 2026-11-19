import request from "supertest";
import { createApp } from "../app.js";
import { verifyToken } from "../auth/token.js";
import { User } from "../models/index.js";

describe("POST /api/auth/login", () => {
  const app = createApp();
  const login = (body?: string | object) => {
    const req = request(app).post("/api/auth/login");
    return body === undefined ? req : req.send(body);
  };

  const createdAt = new Date("2026-01-02T03:04:05.000Z");
  const fakeUser = () =>
    User.build({ id: 7, email: "jane@example.com", passwordHash: "secret-hash", createdAt });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("validation", () => {
    it("400s when there is no body", async () => {
      const findOne = vi.spyOn(User, "findOne");
      const res = await login();
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: "Invalid or missing email" });
      expect(findOne).not.toHaveBeenCalled();
    });

    it("400s when the body is not JSON", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .set("Content-Type", "text/plain")
        .send("email=jane@example.com");
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: "Invalid or missing email" });
    });

    it("400s when email is missing", async () => {
      const res = await login({});
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: "Invalid or missing email" });
    });

    it("400s when email is an empty string", async () => {
      const res = await login({ email: "" });
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: "Invalid or missing email" });
    });

    it.each([
      ["a number", 12345],
      ["an object", { not: "an email" }],
      ["a boolean", true],
    ])("400s when email is %s", async (_label, email) => {
      const findOne = vi.spyOn(User, "findOne");
      const res = await login({ email });
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: "Invalid email" });
      expect(findOne).not.toHaveBeenCalled();
    });

    it("400s for an array of emails without querying (no WHERE IN injection)", async () => {
      const findOne = vi.spyOn(User, "findOne");
      const res = await login({ email: ["jane@example.com", "other@example.com"] });
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: "Invalid email" });
      expect(findOne).not.toHaveBeenCalled();
    });

    it.each(["not-an-email", "jane@", "@example.com", "jane@@example.com", "jane @example.com"])(
      "400s for malformed email %j",
      async (email) => {
        const findOne = vi.spyOn(User, "findOne");
        const res = await login({ email });
        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: "Invalid email" });
        expect(findOne).not.toHaveBeenCalled();
      },
    );
  });

  describe("credentials", () => {
    it("401s when no user has that email", async () => {
      vi.spyOn(User, "findOne").mockResolvedValue(null);
      const res = await login({ email: "nobody@example.com" });
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: "Invalid credentials" });
    });

    it("normalizes the email to lowercase before looking it up", async () => {
      const findOne = vi.spyOn(User, "findOne").mockResolvedValue(fakeUser());
      await login({ email: "Jane@Example.COM" });
      expect(findOne).toHaveBeenCalledWith({ where: { email: "jane@example.com" } });
    });

    it("trims surrounding whitespace before validating and looking it up", async () => {
      const findOne = vi.spyOn(User, "findOne").mockResolvedValue(fakeUser());
      const res = await login({ email: "  Jane@Example.com  " });
      expect(res.status).toBe(200);
      expect(findOne).toHaveBeenCalledWith({ where: { email: "jane@example.com" } });
    });

    it("400s for a whitespace-only email without querying", async () => {
      const findOne = vi.spyOn(User, "findOne");
      const res = await login({ email: "   " });
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: "Invalid email" });
      expect(findOne).not.toHaveBeenCalled();
    });
  });

  describe("success", () => {
    it("200s with the public user fields and a token", async () => {
      vi.spyOn(User, "findOne").mockResolvedValue(fakeUser());
      const res = await login({ email: "jane@example.com" });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        user: { id: 7, email: "jane@example.com", createdAt: createdAt.toISOString() },
        token: expect.any(String),
      });
    });

    it("never includes passwordHash in the response", async () => {
      vi.spyOn(User, "findOne").mockResolvedValue(fakeUser());
      const res = await login({ email: "jane@example.com" });
      expect(res.body.user).not.toHaveProperty("passwordHash");
      expect(JSON.stringify(res.body)).not.toContain("secret-hash");
    });

    it("returns a token that verifies back to the user's id", async () => {
      vi.spyOn(User, "findOne").mockResolvedValue(fakeUser());
      const res = await login({ email: "jane@example.com" });
      const { token } = res.body as { token: string };
      expect(verifyToken(token)).toBe(7);
    });
  });
});
