import { defineComponent, toRef, type PropType, type Ref } from "vue";
import { renderFormRelay } from "@formrelay/vue";
import type { BotProtection, FormRelayError, JsonSchema } from "@formrelay/core";
import { useFormRelay } from "../composables/useFormRelay";

// No initialSchema prop — the Nuxt composable handles SSR schema
// prefetch internally via useAsyncData.
export default defineComponent({
  name: "FormRelay",
  props: {
    formId: { type: String, required: true },
    publicKey: { type: String, default: undefined },
    botProtectionContainer: {
      type: Object as PropType<Ref<HTMLElement | null>>,
      default: undefined,
    },
    botProtection: {
      type: Object as PropType<BotProtection>,
      default: undefined,
    },
    honeypotField: { type: String, default: undefined },
    validate: {
      type: Function as PropType<
        (data: Record<string, unknown>, schema: JsonSchema) => Record<string, string[]>
      >,
      default: undefined,
    },
    onSuccess: {
      type: Function as PropType<(result: { message: string }) => void>,
      default: undefined,
    },
    onError: {
      type: Function as PropType<(error: FormRelayError) => void>,
      default: undefined,
    },
  },
  async setup(props, { slots }) {
    const state = await useFormRelay({
      formId: props.formId,
      publicKey: props.publicKey,
      botProtectionContainer: toRef(props, "botProtectionContainer"),
      botProtection: props.botProtection,
      honeypotField: props.honeypotField,
      validate: props.validate,
      onSuccess: props.onSuccess,
      onError: props.onError,
    });

    return () => renderFormRelay(state, slots);
  },
});
