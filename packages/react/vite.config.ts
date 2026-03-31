import { defineConfig } from "vite-plus";

export default defineConfig({
  pack: {
    entry: {
      index: "src/index.ts",
    },
    dts: true,
    format: ["esm", "cjs"],
    exports: true,
    external: ["react", "@formrelay/core"],
  },
  test: {
    include: ["src/**/*.test.ts"],
  },
});
