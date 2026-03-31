import { defineNuxtModule } from "@nuxt/kit";

export interface ModuleOptions {
  publicKey?: string;
  baseUrl?: string;
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: "@formrelay/nuxt",
    configKey: "formrelay",
  },
  defaults: {
    baseUrl: "https://formrelay.app",
  },
  setup(_options, _nuxt) {
    // Module setup will be implemented in Phase 2
  },
});
