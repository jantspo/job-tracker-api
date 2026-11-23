import request from "supertest";
import { createApp } from "../app.js";
import { User } from "../models/index.js";

describe("app", () => {
  const app = createApp();

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("GET /api/health returns ok", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  it("returns 404 for unknown routes", async () => {
    const res = await request(app).get("/nope");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Not found" });
  });

  // The error handler's own branches are covered in errorHandler.test.ts; these check the wiring.
  describe("body parsing", () => {
    it("400s with a clean message for malformed JSON", async () => {
      const findOne = vi.spyOn(User, "findOne");
      const res = await request(app)
        .post("/api/auth/login")
        .set("Content-Type", "application/json")
        .send('{"email":');
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: "Invalid JSON body" });
      expect(findOne).not.toHaveBeenCalled();
    });

    it("413s with the parser's message when the JSON body is too large", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .set("Content-Type", "application/json")
        .send(JSON.stringify({ email: "x".repeat(200_000) }));
      expect(res.status).toBe(413);
      expect(res.body).toEqual({ error: "request entity too large" });
    });

    it("routes errors thrown by handlers to the JSON error handler", async () => {
      vi.spyOn(console, "error").mockImplementation(() => undefined);
      vi.spyOn(User, "findOne").mockRejectedValue(new Error("db down"));
      const res = await request(app).post("/api/auth/login").send({ email: "jane@example.com" });
      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: "Internal server error" });
    });
  });
});
