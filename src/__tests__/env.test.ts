import { env, parseEnv } from "../env.js";

describe("parseEnv", () => {
  const DATABASE_URL = "postgres://user:pass@localhost:5432/job_tracker";

  it("parses a full environment into typed values", () => {
    expect(parseEnv({ DATABASE_URL, PORT: "8080", DB_LOGGING: "true" })).toEqual({
      DATABASE_URL,
      PORT: 8080,
      DB_LOGGING: true,
    });
  });

  it("defaults PORT to 4000 and DB_LOGGING to false when unset", () => {
    expect(parseEnv({ DATABASE_URL })).toEqual({ DATABASE_URL, PORT: 4000, DB_LOGGING: false });
  });

  it("drops variables that aren't in the schema", () => {
    expect(parseEnv({ DATABASE_URL, HOME: "/home/jane", NODE_ENV: "test" })).toEqual({
      DATABASE_URL,
      PORT: 4000,
      DB_LOGGING: false,
    });
  });

  describe("DATABASE_URL", () => {
    it("throws, naming the variable, when it's missing", () => {
      expect(() => parseEnv({})).toThrow(/DATABASE_URL/);
    });

    it("throws when it's empty", () => {
      expect(() => parseEnv({ DATABASE_URL: "" })).toThrow(/DATABASE_URL/);
    });

    it("throws when it isn't a URL", () => {
      expect(() => parseEnv({ DATABASE_URL: "not a url" })).toThrow(/DATABASE_URL/);
    });
  });

  describe("PORT", () => {
    it.each(["abc", "0", "-1", "3.5"])("throws for %j", (PORT) => {
      expect(() => parseEnv({ DATABASE_URL, PORT })).toThrow(/PORT/);
    });

    it("throws when set but empty, rather than falling back to the default", () => {
      expect(() => parseEnv({ DATABASE_URL, PORT: "" })).toThrow(/PORT/);
    });
  });

  describe("DB_LOGGING", () => {
    it.each(["true", "1", "yes", "on"])("treats %j as true", (DB_LOGGING) => {
      expect(parseEnv({ DATABASE_URL, DB_LOGGING }).DB_LOGGING).toBe(true);
    });

    it.each(["false", "0", "no", "off"])("treats %j as false", (DB_LOGGING) => {
      expect(parseEnv({ DATABASE_URL, DB_LOGGING }).DB_LOGGING).toBe(false);
    });

    it("throws for a value that isn't a boolean string", () => {
      expect(() => parseEnv({ DATABASE_URL, DB_LOGGING: "maybe" })).toThrow(/DB_LOGGING/);
    });
  });

  it("reports every invalid variable in one error", () => {
    expect(() => parseEnv({ PORT: "abc", DB_LOGGING: "maybe" })).toThrow(
      /^Invalid environment:\n[\s\S]*DATABASE_URL[\s\S]*PORT[\s\S]*DB_LOGGING/,
    );
  });
});

describe("env", () => {
  it("is parsed from process.env at import time", () => {
    expect(env.DATABASE_URL).toBe(process.env.DATABASE_URL);
  });
});
