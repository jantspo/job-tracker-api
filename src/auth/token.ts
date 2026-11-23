import { jwtVerify, SignJWT } from "jose";
import type { User } from "../models/user.js";
import { env } from "../env.js";

const secret = new TextEncoder().encode(env.JWT_SECRET);

export async function issueToken(user: User): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime(env.JWT_EXPIRES_IN)
    .sign(secret);
}

export async function verifyToken(token: string): Promise<number | null> {
  try {
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
    if (typeof payload.sub === "string" && /^\d+$/.test(payload.sub)) {
      const id = Number(payload.sub);
      return Number.isSafeInteger(id) && id > 0 ? id : null;
    }
    return null;
  } catch {
    return null;
  }
}
