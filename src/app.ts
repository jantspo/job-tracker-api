import express, { type Request, type Response } from "express";
import { healthRouter } from "./routes/health.js";
import { authRouter } from "./routes/auth.js";
import { errorHandler } from "./middleware/errorHandler.js";

export function createApp() {
  const app = express();

  app.use(express.json());

  app.use("/api/health", healthRouter);

  app.use("/api/auth", authRouter);

  // protected routes
  // app.use("/api/listings", requireUser, listingsRouter);
  // app.use("/api/resume", requireUser, resumeRouter);

  // 404 handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: "Not found" });
  });

  app.use(errorHandler);

  return app;
}
