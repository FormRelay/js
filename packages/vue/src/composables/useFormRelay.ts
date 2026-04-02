import { ref, reactive, computed, watch } from "vue";
import { createForm, FormRelayError, ValidationError } from "@formrelay/core";
import type { FormSchema, JsonSchema, BotProtection, FormField } from "@formrelay/core";
import type { BotProtectionWidget } from "@formrelay/core/bot-protection";
import type { UseFormRelayOptions, UseFormRelayReturn } from "../types";

export function useFormRelay(options: UseFormRelayOptions): UseFormRelayReturn {
  const client = createForm(options.formId, {
    publicKey: options.publicKey,
  });

  const schema = ref<FormSchema | null>(null);
  const schemaLoading = ref(!options.initialSchema);
  const schemaError = ref<FormRelayError | null>(null);

  const values = reactive<Record<string, unknown>>({});
  const errors = ref<Record<string, string[]>>({});

  const submitting = ref(false);
  const submitted = ref(false);

  const botToken = ref<string | null>(null);

  const columns = computed<number>(() => schema.value?.columns ?? 2);
  const fields = computed<FormField[]>(() => schema.value?.fields ?? []);
  const validationSchema = computed<JsonSchema | null>(
    () => schema.value?.validationSchema ?? null,
  );
  const botProtection = computed<BotProtection | null>(() => schema.value?.botProtection ?? null);

  const canSubmit = computed(() => {
    if (submitting.value) return false;
    if (botProtection.value && !botToken.value) return false;
    return true;
  });

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
      schemaError.value =
        error instanceof FormRelayError
          ? error
          : new FormRelayError({
              type: "",
              title: "Unexpected error",
              status: 0,
              detail: error instanceof Error ? error.message : String(error),
            });
    } finally {
      schemaLoading.value = false;
    }
  }

  async function submit() {
    if (!schema.value || !canSubmit.value) return;

    errors.value = {};

    if (options.validate) {
      const validationErrors = options.validate({ ...values }, schema.value.validationSchema);
      if (Object.keys(validationErrors).length > 0) {
        errors.value = validationErrors;
        return;
      }
    }

    submitting.value = true;

    try {
      const result = await client.submit(
        { ...values },
        botToken.value ? { botToken: botToken.value } : {},
      );

      if (result.success) {
        submitted.value = true;
        options.onSuccess?.({ message: result.message });
      } else {
        if (result.error instanceof ValidationError) {
          errors.value = result.error.fieldErrors;
        }
        options.onError?.(result.error);
      }
    } finally {
      submitting.value = false;
    }
  }

  let currentWidget: BotProtectionWidget | null = null;
  let tokenLoopHandle: { stop: () => void } | null = null;

  function reset() {
    for (const key of Object.keys(values)) {
      values[key] = "";
    }
    errors.value = {};
    submitted.value = false;
    botToken.value = null;
    if (currentWidget) {
      currentWidget.reset();
    }
  }

  function setBotToken(token: string) {
    botToken.value = token;
  }

  if (options.botProtectionContainer) {
    watch(
      [options.botProtectionContainer, botProtection] as const,
      async ([container, protection], _, onCleanup) => {
        let cancelled = false;
        onCleanup(() => {
          cancelled = true;
          tokenLoopHandle?.stop();
          tokenLoopHandle = null;
          currentWidget = null;
          botToken.value = null;
        });

        if (!container || !protection) return;

        try {
          const { loadBotProtectionWidget, runTokenLoop } =
            await import("@formrelay/core/bot-protection");
          if (cancelled) return;

          const widget = await loadBotProtectionWidget(protection, container);
          if (cancelled) {
            widget.remove();
            return;
          }

          currentWidget = widget;
          tokenLoopHandle = runTokenLoop(widget, setBotToken);
        } catch (error) {
          if (!cancelled) {
            console.error("[FormRelay] Failed to initialize bot protection:", error);
          }
        }
      },
      { immediate: true },
    );
  }

  return {
    schema,
    columns,
    fields,
    schemaLoading,
    schemaError,
    values,
    errors,
    submitting,
    submitted,
    canSubmit,
    submit,
    reset,
    setBotToken,
    validationSchema,
    botProtection,
  };
}
