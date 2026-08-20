import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@shared": resolve(import.meta.dirname, "src/upstream/shared"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    include: ["test/**/*.test.ts", "src/upstream/**/*.spec.ts"],
    setupFiles: ["src/upstream/shared/mocks/functions.mock.ts"],
  },
});
