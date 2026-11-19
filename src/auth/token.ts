import type { User } from "../models/user.js";

export function issueToken(user: User): string {
  return String(user.id);
}

export function verifyToken(token: string): number | null {
  if (!/^\d+$/.test(token)) return null;
  const id = Number(token);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}
