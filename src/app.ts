import express, { type Request, type Response, type NextFunction } from "express";
import { healthRouter } from "./routes/health.js";

export function createApp() {
  const app = express();

  app.use(express.json());

  app.use("/api/health", healthRouter);

  // 404 handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: "Not found" });
  });

  // Error handler
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  });

  return app;
}
