import { Router } from "express";

export const authRouter = Router();

authRouter.post("/login", (_req, res) => {
  // TODO: add user lookup. returns { User, token } or 401
  res.status(501).json({ error: "Not implemented" });
});
