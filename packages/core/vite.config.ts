import { defineConfig } from "vite-plus";

export default defineConfig({
  pack: {
    entry: {
      index: "src/index.ts",
      validation: "src/validation/index.ts",
      turnstile: "src/bot-protection/turnstile.ts",
      "recaptcha-v2": "src/bot-protection/recaptcha-v2.ts",
      "recaptcha-v3": "src/bot-protection/recaptcha-v3.ts",
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
  },
  test: {
    include: ["src/**/*.test.ts"],
  },
});
