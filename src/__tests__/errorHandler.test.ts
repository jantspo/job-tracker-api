import express from "express";
import request from "supertest";
import { UniqueConstraintError, ValidationError, type ValidationErrorItem } from "sequelize";
import { errorHandler } from "../middleware/errorHandler.js";

describe("errorHandler", () => {
  // A throwaway app whose only route passes `err` to the handler.
  const failWith = (err: unknown) => {
    const app = express();
    app.get("/", (_req, _res, next) => {
      next(err);
    });
    app.use(errorHandler);
    return request(app).get("/");
  };

  const silenceConsoleError = () => vi.spyOn(console, "error").mockImplementation(() => undefined);

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Sequelize errors", () => {
    it("409s for a unique constraint violation", async () => {
      const res = await failWith(new UniqueConstraintError({}));
      expect(res.status).toBe(409);
      expect(res.body).toEqual({ error: "Already exists" });
    });

    it("400s with the first message of a ValidationError", async () => {
      const res = await failWith(
        new ValidationError("Validation error", [
          { message: "title cannot be empty" } as ValidationErrorItem,
          { message: "second problem" } as ValidationErrorItem,
        ]),
      );
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: "title cannot be empty" });
    });

    it("400s with a fallback message for a ValidationError with no items", async () => {
      const res = await failWith(new ValidationError("Validation error", []));
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: "Validation failed" });
    });
  });

  it("400s with a clean message for a JSON parse failure", async () => {
    const res = await failWith(
      Object.assign(new SyntaxError("Unexpected token"), {
        status: 400,
        type: "entity.parse.failed",
        expose: true,
      }),
    );
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Invalid JSON body" });
  });

  describe("4xx errors", () => {
    it("uses the status and message of an exposed error", async () => {
      const res = await failWith(
        Object.assign(new Error("I'm a teapot"), { status: 418, expose: true }),
      );
      expect(res.status).toBe(418);
      expect(res.body).toEqual({ error: "I'm a teapot" });
    });

    it("reads statusCode when status is absent", async () => {
      const res = await failWith(
        Object.assign(new Error("Gone"), { statusCode: 410, expose: true }),
      );
      expect(res.status).toBe(410);
      expect(res.body).toEqual({ error: "Gone" });
    });

    it("hides the message of an unexposed error behind the standard status phrase", async () => {
      const res = await failWith(Object.assign(new Error("internal detail"), { status: 403 }));
      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: "Forbidden" });
    });

    it("hides the message when expose is truthy but not true", async () => {
      const res = await failWith(
        Object.assign(new Error("internal detail"), { status: 404, expose: "yes" }),
      );
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: "Not Found" });
    });

    it("falls back to a generic message for a status with no standard phrase", async () => {
      const res = await failWith(Object.assign(new Error("x"), { status: 499 }));
      expect(res.status).toBe(499);
      expect(res.body).toEqual({ error: "Error" });
    });

    it("doesn't log them", async () => {
      const consoleError = silenceConsoleError();
      await failWith(Object.assign(new Error("nope"), { status: 400, expose: true }));
      expect(consoleError).not.toHaveBeenCalled();
    });
  });

  describe("5xx and unknown errors", () => {
    it("500s without leaking details for a plain Error, and logs it", async () => {
      const consoleError = silenceConsoleError();
      const err = new Error("db down");
      const res = await failWith(err);
      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: "Internal server error" });
      expect(consoleError).toHaveBeenCalledWith(err);
    });

    it("keeps a 5xx status but hides the message", async () => {
      silenceConsoleError();
      const res = await failWith(
        Object.assign(new Error("upstream"), { status: 503, expose: true }),
      );
      expect(res.status).toBe(503);
      expect(res.body).toEqual({ error: "Internal server error" });
    });

    it.each([
      ["a status below 400", 200],
      ["a redirect status", 302],
      ["a status above 599", 600],
      ["a string status", "400"],
      ["a non-integer status", 400.5],
      ["NaN", Number.NaN],
    ])("500s for %s", async (_label, status) => {
      silenceConsoleError();
      const res = await failWith(Object.assign(new Error("x"), { status }));
      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: "Internal server error" });
    });

    it("500s for a thrown string, and logs it", async () => {
      const consoleError = silenceConsoleError();
      const res = await failWith("boom");
      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: "Internal server error" });
      expect(consoleError).toHaveBeenCalledWith("boom");
    });

    it("500s for a thrown non-Error object without reading its message", async () => {
      silenceConsoleError();
      const res = await failWith({ message: "secret", expose: "true" });
      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: "Internal server error" });
    });
  });
});
