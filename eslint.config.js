// @ts-check
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import vitest from "@vitest/eslint-plugin";
import prettier from "eslint-config-prettier";
import globals from "globals";

export default tseslint.config(
  { ignores: ["dist/", "coverage/", "node_modules/"] },

  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  {
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        projectService: {
          allowDefaultProject: ["*.config.ts", "eslint.config.js"],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Allow intentionally unused args/vars when prefixed with _
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/consistent-type-imports": ["error", { fixStyle: "inline-type-imports" }],
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/switch-exhaustiveness-check": "error",
      eqeqeq: ["error", "always", { null: "ignore" }],
      "no-var": "error",
      "prefer-const": "error",
      "object-shorthand": "error",
    },
  },

  // Plain JS config files: skip type-aware rules
  {
    files: ["**/*.js"],
    ...tseslint.configs.disableTypeChecked,
  },

  // Tests
  {
    files: ["src/**/*.test.ts", "src/**/*.spec.ts", "src/__tests__/**"],
    plugins: { vitest },
    rules: {
      ...vitest.configs.recommended.rules,
      // Supertest's res.body is `any`; allow inspecting it in tests
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
    },
    languageOptions: {
      globals: vitest.environments.env.globals,
    },
  },

  // Must be last: turns off rules that conflict with Prettier formatting
  prettier,
);
