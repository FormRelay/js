import { useFormRelay as useVueFormRelay } from "@formrelay/vue";
import type { UseFormRelayOptions } from "@formrelay/vue";
import { createForm } from "@formrelay/core";
import type { HttpAdapter, HttpResponse, RequestOptions } from "@formrelay/core";
import { useRuntimeConfig, useAsyncData } from "#imports";

function createSecretKeyAdapter(secretKey: string): HttpAdapter {
  return {
    async get(url: string, options: RequestOptions): Promise<HttpResponse> {
      const response = await fetch(url, {
        method: "GET",
        headers: { ...options.headers, "X-Form-Secret-Key": secretKey },
      });
      return {
        status: response.status,
        headers: response.headers,
        json: () => response.json(),
      };
    },
    async post(url: string, body: unknown, options: RequestOptions): Promise<HttpResponse> {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...options.headers },
        body: JSON.stringify(body),
      });
      return {
        status: response.status,
        headers: response.headers,
        json: () => response.json(),
      };
    },
  };
}

export async function useFormRelay(options: Partial<UseFormRelayOptions> & { formId: string }) {
  const runtimeConfig = useRuntimeConfig();
  const config = runtimeConfig.public.formrelay as {
    publicKey: string;
  };

  const secretKey = (runtimeConfig as Record<string, unknown>).formrelaySecretKey as
    | string
    | undefined;

  const publicKey = options.publicKey ?? config.publicKey;

  const schemaClient =
    import.meta.server && secretKey
      ? createForm(options.formId, {
          publicKey,
          httpClient: createSecretKeyAdapter(secretKey),
        })
      : createForm(options.formId, { publicKey });

  const { data: initialSchema } = await useAsyncData(`formrelay-schema-${options.formId}`, () =>
    schemaClient.getSchema(),
  );

  return useVueFormRelay({
    formId: options.formId,
    publicKey,
    initialSchema: initialSchema.value ?? undefined,
    botProtectionContainer: options.botProtectionContainer,
    validate: options.validate,
    onSuccess: options.onSuccess,
    onError: options.onError,
  });
}
