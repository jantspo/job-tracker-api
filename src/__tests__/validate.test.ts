import express from "express";
import request from "supertest";
import { z } from "zod";
import { validate } from "../middleware/validate.js";

describe("validate", () => {
  // The message goes on coerce.number() too: "abc" coerces to NaN, which fails the type check.
  const params = z.object({
    id: z.coerce.number({ error: "Invalid id" }).int("Invalid id").positive("Invalid id"),
  });
  const query = z.object({ limit: z.coerce.number().int().max(50, "Limit too high").default(10) });
  const body = z.object({
    name: z.string({ error: "Invalid name" }).trim().min(1, "Invalid name"),
  });

  const handler = vi.fn<(locals: unknown) => void>();

  // A throwaway app that echoes whatever `validate` stored on res.locals.
  const app = express();
  app.use(express.json());
  app.post("/items/:id", validate({ params, query, body }), (_req, res) => {
    const { body: b, params: p, query: q } = res.locals;
    handler({ body: b, params: p, query: q });
    res.json({ body: b, params: p, query: q });
  });
  app.get("/query-only", validate({ query }), (_req, res) => {
    res.json({ body: res.locals.body ?? null, params: res.locals.params ?? null });
  });
  app.post("/body-only", validate({ body }), (_req, res) => {
    res.json({ body: res.locals.body });
  });

  afterEach(() => {
    handler.mockClear();
  });

  it("stores parsed and transformed values on res.locals and calls the handler", async () => {
    const res = await request(app).post("/items/42?limit=5").send({ name: "  Widget  " });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ params: { id: 42 }, query: { limit: 5 }, body: { name: "Widget" } });
    expect(handler).toHaveBeenCalledOnce();
  });

  it("applies schema defaults", async () => {
    const res = await request(app).post("/items/1").send({ name: "Widget" });
    expect(res.body.query).toEqual({ limit: 10 });
  });

  it("drops keys the schema doesn't define", async () => {
    const res = await request(app).post("/items/1?limit=5&extra=1").send({ name: "Widget", x: 1 });
    expect(res.body.query).toEqual({ limit: 5 });
    expect(res.body.body).toEqual({ name: "Widget" });
  });

  it("400s with the issue's message for invalid params, without calling the handler", async () => {
    const res = await request(app).post("/items/abc").send({ name: "Widget" });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Invalid id" });
    expect(handler).not.toHaveBeenCalled();
  });

  it("400s for an invalid query", async () => {
    const res = await request(app).post("/items/1?limit=500").send({ name: "Widget" });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Limit too high" });
    expect(handler).not.toHaveBeenCalled();
  });

  it("400s for an invalid body", async () => {
    const res = await request(app).post("/items/1").send({ name: "   " });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Invalid name" });
    expect(handler).not.toHaveBeenCalled();
  });

  it("checks params before query before body, reporting the first failing part", async () => {
    const all = await request(app).post("/items/abc?limit=500").send({ name: "" });
    expect(all.body).toEqual({ error: "Invalid id" });

    const queryAndBody = await request(app).post("/items/1?limit=500").send({ name: "" });
    expect(queryAndBody.body).toEqual({ error: "Limit too high" });
  });

  it("reports only the first issue when a part has several", async () => {
    const twoFields = z.object({
      a: z.string({ error: "a is invalid" }),
      b: z.string({ error: "b is invalid" }),
    });
    const multi = express();
    multi.use(express.json());
    multi.post("/", validate({ body: twoFields }), (_req, res) => {
      res.json({});
    });

    const res = await request(multi).post("/").send({});
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "a is invalid" });
  });

  it("treats a missing body as an empty object", async () => {
    const res = await request(app).post("/body-only");
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Invalid name" });
  });

  it("only validates and stores the parts it was given schemas for", async () => {
    const res = await request(app).get("/query-only?limit=3");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ body: null, params: null });
  });
});
