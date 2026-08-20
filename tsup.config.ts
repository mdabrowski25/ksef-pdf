import { defineConfig } from "tsup";
import { resolve } from "node:path";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  target: "node22",
  platform: "node",
  splitting: false,
  treeshake: true,
  minify: false,
  esbuildOptions(options) {
    options.alias = {
      ...options.alias,
      "@shared": resolve("src/upstream/shared"),
    };
  },
});
