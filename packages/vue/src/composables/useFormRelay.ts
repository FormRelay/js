import { ref, reactive, computed } from "vue";
import { createForm } from "@formrelay/core";
import type {
  FormSchema,
  FormRelayError,
  JsonSchema,
  BotProtection,
  FormField,
} from "@formrelay/core";
import type { UseFormRelayOptions, UseFormRelayReturn } from "../types";

export function useFormRelay(options: UseFormRelayOptions): UseFormRelayReturn {
  const client = createForm(options.formId, {
    publicKey: options.publicKey,
    baseUrl: options.baseUrl,
  });

  const schema = ref<FormSchema | null>(null);
  const schemaLoading = ref(!options.initialSchema);
  const schemaError = ref<FormRelayError | null>(null);

  const values = reactive<Record<string, unknown>>({});
  const errors = ref<Record<string, string[]>>({});

  const submitting = ref(false);
  const submitted = ref(false);

  let botToken: string | null = null;

  const fields = computed<FormField[]>(() => schema.value?.fields ?? []);
  const validationSchema = computed<JsonSchema | null>(
    () => schema.value?.validationSchema ?? null,
  );
  const botProtection = computed<BotProtection | null>(
    () => schema.value?.botProtection ?? null,
  );

  function initializeValues(loadedSchema: FormSchema) {
    for (const field of loadedSchema.fields) {
      values[field.name] = "";
    }
  }

  if (options.initialSchema) {
    schema.value = options.initialSchema;
    initializeValues(options.initialSchema);
  } else {
    fetchSchema();
  }

  async function fetchSchema() {
    schemaLoading.value = true;
    schemaError.value = null;

    try {
      const loadedSchema = await client.getSchema();
      schema.value = loadedSchema;
      initializeValues(loadedSchema);
    } catch (error) {
      schemaError.value = error as FormRelayError;
    } finally {
      schemaLoading.value = false;
    }
  }

  async function submit() {
    if (!schema.value) return;

    errors.value = {};

    if (options.validate) {
      const validationErrors = options.validate(
        { ...values },
        schema.value.validationSchema,
      );
      if (Object.keys(validationErrors).length > 0) {
        errors.value = validationErrors;
        return;
      }
    }

    submitting.value = true;

    try {
      const result = await client.submit(
        { ...values },
        botToken ? { botToken } : {},
      );

      if (result.success) {
        submitted.value = true;
        options.onSuccess?.({ message: result.message });
      } else {
        options.onError?.(result.error);
      }
    } finally {
      submitting.value = false;
    }
  }

  function reset() {
    for (const key of Object.keys(values)) {
      values[key] = "";
    }
    errors.value = {};
    submitted.value = false;
  }

  function setBotToken(token: string) {
    botToken = token;
  }

  return {
    schema,
    fields,
    schemaLoading,
    schemaError,
    values,
    errors,
    submitting,
    submitted,
    submit,
    reset,
    setBotToken,
    validationSchema,
    botProtection,
  };
}
