import { defineConfig } from "vite-plus";

export default defineConfig({
  pack: {
    entry: {
      index: "src/index.ts",
      validation: "src/validation/index.ts",
    },
    dts: true,
    format: ["esm", "cjs"],
    exports: true,
  },
  test: {
    include: ["src/**/*.test.ts"],
  },
});
