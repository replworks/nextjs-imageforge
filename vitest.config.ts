import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    exclude: ["tests/fixtures/**", "node_modules/**"],
    globalSetup: ["tests/global-setup.ts"],
    typecheck: {
      enabled: true,
      include: ["tests/config-types.test.ts"],
      tsconfig: "tests/tsconfig.json",
    },
  },
});
