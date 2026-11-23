import { STATUS_CODES } from "node:http";
import { type Request, type Response, type NextFunction } from "express";
import { UniqueConstraintError, ValidationError } from "sequelize";

interface NormalizedError {
  /** Always an integer from 400 to 599. */
  status: number;
  type?: string;
  /** Only set when the error is marked safe to show the client (`expose: true`). */
  message?: string;
}

/** Anything can be thrown, so read only fields that are present and well-typed. */
function normalize(err: unknown): NormalizedError {
  if (typeof err !== "object" || err === null) return { status: 500 };

  const e = err as Record<string, unknown>;
  const raw = e.status ?? e.statusCode;
  const status =
    typeof raw === "number" && Number.isInteger(raw) && raw >= 400 && raw <= 599 ? raw : 500;

  return {
    status,
    type: typeof e.type === "string" ? e.type : undefined,
    message: e.expose === true && typeof e.message === "string" ? e.message : undefined,
  };
}

/**
 * Last middleware in `createApp()`. Responds with `{ error: string }`: JSON parse failures and
 * Sequelize validation errors become 400, unique-constraint violations 409, other 4xx errors keep
 * their status (with their message only if exposed), and everything else is logged and hidden.
 */
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  // Sequelize errors carry no status; instanceof is safe on any thrown value.
  if (err instanceof UniqueConstraintError) {
    res.status(409).json({ error: "Already exists" });
    return;
  }

  if (err instanceof ValidationError) {
    res.status(400).json({ error: err.errors[0]?.message ?? "Validation failed" });
    return;
  }

  const { status, type, message } = normalize(err);

  if (type === "entity.parse.failed") {
    res.status(400).json({ error: "Invalid JSON body" });
    return;
  }

  if (status < 500) {
    res.status(status).json({ error: message ?? STATUS_CODES[status] ?? "Error" });
    return;
  }

  console.error(err);
  res.status(status).json({ error: "Internal server error" });
}
