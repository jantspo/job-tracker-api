import { Router } from "express";

export const authRouter = Router();

authRouter.post("/login", async (req, res) => {
  // TODO: add user lookup. returns { User, token } or 401
});
