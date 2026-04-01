import { defineNuxtModule, addImports, addComponent, createResolver } from "@nuxt/kit";

export interface ModuleOptions {
  publicKey?: string;
  secretKey?: string;
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: "@formrelay/nuxt",
    configKey: "formrelay",
  },
  defaults: {},
  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url);

    nuxt.options.runtimeConfig.public.formrelay = {
      publicKey: options.publicKey ?? "",
    };

    if (options.secretKey) {
      nuxt.options.runtimeConfig.formrelaySecretKey = options.secretKey;
    }

    addImports({
      name: "useFormRelay",
      from: resolver.resolve("./runtime/composables/useFormRelay"),
    });

    addComponent({
      name: "FormRelay",
      filePath: resolver.resolve("./runtime/components/FormRelay"),
    });
  },
});
