import { type Request, type Response, type NextFunction } from "express";
import { User } from "../models/index.js";
import { verifyToken } from "../auth/token.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Locals {
      /** Set by `requireUser`; present on any route mounted behind it. */
      user?: User;
    }
  }
}

/**
 * Expects `Authorization: Bearer <jwt>`, verifies it with `verifyToken`, and loads that
 * user into `res.locals.user`. Responds 401 with `Authentication required` if the header
 * is missing or malformed, or `Invalid token` if the token is invalid or expired (checked
 * before any query) or its user no longer exists.
 */
export async function requireUser(req: Request, res: Response, next: NextFunction) {
  const match = /^Bearer\s+(\S+)$/i.exec(req.get("authorization") ?? "");
  if (!match) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const id = await verifyToken(match[1]);
  if (id === null) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }

  const user = await User.findByPk(id);
  if (!user) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }

  res.locals.user = user;
  next();
}
