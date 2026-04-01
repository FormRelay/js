import {
  defineNuxtModule,
  addImports,
  addComponent,
  createResolver,
} from "@nuxt/kit";

export interface ModuleOptions {
  publicKey?: string;
  secretKey?: string;
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
  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url);

    nuxt.options.runtimeConfig.public.formrelay = {
      publicKey: options.publicKey ?? "",
      baseUrl: options.baseUrl ?? "https://formrelay.app",
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
