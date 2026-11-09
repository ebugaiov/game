import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/features/game/domain/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/**",
                "../server/**",
                "../ui/**",
                "../schemas*",
                "../api-client*",
                "../../**",
              ],
              message:
                "The domain layer must stay pure and import nothing from the rest of the app.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/features/game/ui/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/db", "**/db/**", "**/server", "**/server/**", "server-only"],
              message: "UI may only import domain, schemas and api-client; never db or server.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/features/game/server/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/ui", "**/ui/**"],
              message: "Server code must not import UI components.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/app/api/games/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/db", "@/db/**"],
              message: "Route handlers must go through server use-cases, never the database.",
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
