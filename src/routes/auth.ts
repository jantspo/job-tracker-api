import { Router } from "express";
import { User } from "../models/index.js";
import { issueToken } from "../auth/token.js";
import { validate } from "../middleware/validate.js";
import { loginBody, type LoginBody } from "../schemas/auth.js";

export const authRouter = Router();

authRouter.post("/login", validate({ body: loginBody }), async (_req, res) => {
  const { email: normalizedEmail } = res.locals.body as LoginBody;

  // In a real world scenario this would include a password check, so we'd have to add
  // password to the scope
  // User.scope("withPassword").findOne(...)
  const user = await User.findOne({
    where: {
      email: normalizedEmail,
    },
  });

  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const { id, email, createdAt } = user;
  res.json({ user: { id, email, createdAt }, token: issueToken(user) });
});
