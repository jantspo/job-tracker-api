import { type Request, type Response, type NextFunction } from "express";
import { User } from "../models/index.js";

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
 * Mock auth for the demo: expects `Authorization: Bearer <userId>` and loads that user
 * into `res.locals.user`. Responds 401 if the header is missing/malformed or the user
 * doesn't exist. Swap the token parsing for real verification (e.g. a JWT) later.
 */
export async function requireUser(req: Request, res: Response, next: NextFunction) {
  const match = /^Bearer\s+(\d+)$/i.exec(req.get("authorization") ?? "");
  if (!match) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const user = await User.findByPk(Number(match[1]));
  if (!user) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }

  res.locals.user = user;
  next();
}
