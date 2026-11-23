import { type RequestHandler } from "express";
import { type ZodType } from "zod";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Locals {
      /** Set by `validate`: the parsed (and transformed) request parts. */
      body?: unknown;
      params?: unknown;
      query?: unknown;
    }
  }
}

interface Schemas {
  body?: ZodType;
  params?: ZodType;
  query?: ZodType;
}

export function validate(schemas: Schemas): RequestHandler {
  return (req, res, next) => {
    for (const part of ["params", "query", "body"] as const) {
      const schema = schemas[part];
      if (!schema) continue;

      const result = schema.safeParse(req[part] ?? {});
      if (!result.success) {
        res.status(400).json({ error: result.error.issues[0]?.message ?? "Invalid request" });
        return;
      }
      res.locals[part] = result.data;
    }
    next();
  };
}
