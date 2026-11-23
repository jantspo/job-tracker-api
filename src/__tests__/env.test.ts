import { env, parseEnv } from "../env.js";

describe("parseEnv", () => {
  const DATABASE_URL = "postgres://user:pass@localhost:5432/job_tracker";
  const JWT_SECRET = "a".repeat(32);
  /** The minimum valid environment; spread into each case. */
  const base = { DATABASE_URL, JWT_SECRET };
  const defaults = { PORT: 4000, DB_LOGGING: false, JWT_EXPIRES_IN: "15m" };

  it("parses a full environment into typed values", () => {
    expect(parseEnv({ ...base, PORT: "8080", DB_LOGGING: "true", JWT_EXPIRES_IN: "1h" })).toEqual({
      ...base,
      PORT: 8080,
      DB_LOGGING: true,
      JWT_EXPIRES_IN: "1h",
    });
  });

  it("defaults PORT, DB_LOGGING and JWT_EXPIRES_IN when unset", () => {
    expect(parseEnv(base)).toEqual({ ...base, ...defaults });
  });

  it("drops variables that aren't in the schema", () => {
    expect(parseEnv({ ...base, HOME: "/home/jane", NODE_ENV: "test" })).toEqual({
      ...base,
      ...defaults,
    });
  });

  describe("DATABASE_URL", () => {
    it("throws, naming the variable, when it's missing", () => {
      expect(() => parseEnv({ JWT_SECRET })).toThrow(/DATABASE_URL/);
    });

    it("throws when it's empty", () => {
      expect(() => parseEnv({ ...base, DATABASE_URL: "" })).toThrow(/DATABASE_URL/);
    });

    it("throws when it isn't a URL", () => {
      expect(() => parseEnv({ ...base, DATABASE_URL: "not a url" })).toThrow(/DATABASE_URL/);
    });
  });

  describe("PORT", () => {
    it.each(["abc", "0", "-1", "3.5"])("throws for %j", (PORT) => {
      expect(() => parseEnv({ ...base, PORT })).toThrow(/PORT/);
    });

    it("throws when set but empty, rather than falling back to the default", () => {
      expect(() => parseEnv({ ...base, PORT: "" })).toThrow(/PORT/);
    });
  });

  describe("DB_LOGGING", () => {
    it.each(["true", "1", "yes", "on"])("treats %j as true", (DB_LOGGING) => {
      expect(parseEnv({ ...base, DB_LOGGING }).DB_LOGGING).toBe(true);
    });

    it.each(["false", "0", "no", "off"])("treats %j as false", (DB_LOGGING) => {
      expect(parseEnv({ ...base, DB_LOGGING }).DB_LOGGING).toBe(false);
    });

    it("throws for a value that isn't a boolean string", () => {
      expect(() => parseEnv({ ...base, DB_LOGGING: "maybe" })).toThrow(/DB_LOGGING/);
    });
  });

  describe("JWT_SECRET", () => {
    it("throws, naming the variable, when it's missing", () => {
      expect(() => parseEnv({ DATABASE_URL })).toThrow(/JWT_SECRET/);
    });

    it("throws when it's shorter than 32 characters", () => {
      expect(() => parseEnv({ ...base, JWT_SECRET: "a".repeat(31) })).toThrow(/JWT_SECRET/);
    });

    it("accepts exactly 32 characters", () => {
      expect(parseEnv(base).JWT_SECRET).toBe(JWT_SECRET);
    });
  });

  it("reports every invalid variable in one error", () => {
    expect(() => parseEnv({ PORT: "abc", DB_LOGGING: "maybe" })).toThrow(
      /^Invalid environment:\n[\s\S]*DATABASE_URL[\s\S]*PORT[\s\S]*DB_LOGGING[\s\S]*JWT_SECRET/,
    );
  });
});

describe("env", () => {
  it("is parsed from process.env at import time", () => {
    expect(env.DATABASE_URL).toBe(process.env.DATABASE_URL);
    expect(env.JWT_SECRET).toBe(process.env.JWT_SECRET);
  });
});
