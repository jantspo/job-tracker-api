import { z } from "zod";

const MISSING = "Invalid or missing email";
const INVALID = "Invalid email";

export const loginBody = z.object({
  email: z
    .string({ error: (issue) => (issue.input == null ? MISSING : INVALID) })
    .min(1, MISSING)
    .trim()
    .max(254, INVALID) // RFC 5321 limit; checked after trim so padding doesn't count
    .toLowerCase()
    .pipe(z.email({ error: INVALID })),
});

export type LoginBody = z.infer<typeof loginBody>;
