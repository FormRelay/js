import { defineConfig } from "vite-plus";

export default defineConfig({
  pack: {
    entry: {
      index: "src/index.ts",
    },
    dts: true,
    format: ["esm", "cjs"],
    exports: {
      customExports(pkg) {
        for (const [key, value] of Object.entries(pkg)) {
          if (key === "./package.json" || typeof value === "string") continue;
          const entry = value as Record<string, string>;
          if (entry.import && !entry.types) {
            entry.types = entry.import.replace(".mjs", ".d.mts");
          }
        }
        return pkg;
      },
    },
    external: ["vue", /^@formrelay\/core/],
  },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "jsdom",
  },
});
