import { Router } from "express";
import { User } from "../models/index.js";
import { issueToken } from "../auth/token.js";

export const authRouter = Router();

const emailRegex =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

authRouter.post("/login", async (req, res) => {
  const { email: reqEmail } = (req.body ?? {}) as { email?: unknown };

  if (!reqEmail) {
    res.status(400).json({ error: "Invalid or missing email" });
    return;
  }

  if (typeof reqEmail !== "string") {
    res.status(400).json({ error: "Invalid email" });
    return;
  }

  const normalizedEmail = reqEmail.trim().toLowerCase();

  if (!emailRegex.test(normalizedEmail)) {
    res.status(400).json({ error: "Invalid email" });
    return;
  }

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
  const publicUser = { id, email, createdAt };

  res.json({ user: publicUser, token: issueToken(user) });
});
