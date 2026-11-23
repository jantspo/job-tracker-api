import { SignJWT, decodeJwt, decodeProtectedHeader } from "jose";
import { issueToken, verifyToken } from "../auth/token.js";
import { User } from "../models/index.js";

// Same secret the app uses (set per project in vitest.config.ts).
const secret = new TextEncoder().encode(process.env.JWT_SECRET);
const otherSecret = new TextEncoder().encode("some-other-secret-that-is-32-chars-long!");

const user = () => User.build({ id: 7, email: "jane@example.com", passwordHash: "x" });

/** Signs a token the way the app should, with overridable pieces for negative cases. */
function sign({
  sub = "7",
  alg = "HS256",
  key = secret,
  exp = "15m",
}: { sub?: string | null; alg?: string; key?: Uint8Array; exp?: string | number } = {}) {
  const jwt = new SignJWT({}).setProtectedHeader({ alg }).setIssuedAt().setExpirationTime(exp);
  if (sub !== null) jwt.setSubject(sub);
  return jwt.sign(key);
}

const base64url = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");

describe("issueToken", () => {
  it("returns a signed JWT, not the bare user id", async () => {
    const token = await issueToken(user());
    expect(token).not.toBe("7");
    expect(token.split(".")).toHaveLength(3);
  });

  it("signs with HS256 and puts the user id in sub", async () => {
    const token = await issueToken(user());
    expect(decodeProtectedHeader(token).alg).toBe("HS256");
    expect(decodeJwt(token).sub).toBe("7");
  });

  it("expires after JWT_EXPIRES_IN (15m in tests)", async () => {
    const { iat, exp } = decodeJwt(await issueToken(user()));
    expect(exp! - iat!).toBe(15 * 60);
  });

  it("doesn't put the email (or anything else) in the payload", async () => {
    const payload = decodeJwt(await issueToken(user()));
    expect(Object.keys(payload).sort()).toEqual(["exp", "iat", "sub"]);
  });
});

describe("verifyToken", () => {
  it("round-trips an issued token to the user's id", async () => {
    expect(await verifyToken(await issueToken(user()))).toBe(7);
  });

  it("accepts a valid token signed elsewhere with the same secret", async () => {
    expect(await verifyToken(await sign({ sub: "42" }))).toBe(42);
  });

  describe("returns null", () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it("for an expired token", async () => {
      const token = await issueToken(user());
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(Date.now() + 16 * 60 * 1000);
      expect(await verifyToken(token)).toBeNull();
    });

    it("for a token whose exp is already in the past", async () => {
      expect(await verifyToken(await sign({ exp: Math.floor(Date.now() / 1000) - 60 }))).toBeNull();
    });

    it("for a token signed with a different secret", async () => {
      expect(await verifyToken(await sign({ key: otherSecret }))).toBeNull();
    });

    it("for a token signed with a different HMAC algorithm (algorithms are pinned)", async () => {
      expect(await verifyToken(await sign({ alg: "HS512" }))).toBeNull();
    });

    it("for an unsigned alg: none token", async () => {
      const now = Math.floor(Date.now() / 1000);
      const token = `${base64url({ alg: "none" })}.${base64url({ sub: "7", iat: now, exp: now + 900 })}.`;
      expect(await verifyToken(token)).toBeNull();
    });

    it("for a token whose payload was tampered with", async () => {
      const [header, , signature] = (await sign({ sub: "7" })).split(".");
      const now = Math.floor(Date.now() / 1000);
      const forged = `${header}.${base64url({ sub: "1", iat: now, exp: now + 900 })}.${signature}`;
      expect(await verifyToken(forged)).toBeNull();
    });

    it.each(["", "7", "abc", "a.b.c", "Bearer 7"])("for the non-JWT string %j", async (token) => {
      expect(await verifyToken(token)).toBeNull();
    });

    it("for a validly signed token with no sub", async () => {
      expect(await verifyToken(await sign({ sub: null }))).toBeNull();
    });

    it.each(["0", "-1", "1.5", "abc", "7abc", "9007199254740993"])(
      "for a validly signed token with sub %j",
      async (sub) => {
        expect(await verifyToken(await sign({ sub }))).toBeNull();
      },
    );
  });
});
