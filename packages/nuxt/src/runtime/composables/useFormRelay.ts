import { useFormRelay as useVueFormRelay } from "@formrelay/vue";
import type { UseFormRelayOptions } from "@formrelay/vue";
import { createForm } from "@formrelay/core";
import { useRuntimeConfig, useAsyncData } from "#imports";

export async function useFormRelay(options: Partial<UseFormRelayOptions> & { formId: string }) {
  const config = useRuntimeConfig().public.formrelay as {
    publicKey: string;
    baseUrl: string;
  };

  const publicKey = options.publicKey ?? config.publicKey;
  const baseUrl = options.baseUrl ?? config.baseUrl;

  const client = createForm(options.formId, { publicKey, baseUrl });

  const { data: initialSchema } = await useAsyncData(`formrelay-schema-${options.formId}`, () =>
    client.getSchema(),
  );

  return useVueFormRelay({
    formId: options.formId,
    publicKey,
    baseUrl,
    initialSchema: initialSchema.value ?? undefined,
    validate: options.validate,
    onSuccess: options.onSuccess,
    onError: options.onError,
  });
}
