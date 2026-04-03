import { defineComponent, toRef, type PropType, type Ref } from "vue";
import { useFormRelay } from "../composables/useFormRelay";
import { renderFormRelay } from "./renderFormRelay";
import type { BotProtection, FormRelayError, FormSchema, JsonSchema } from "@formrelay/core";

export default defineComponent({
  name: "FormRelay",
  props: {
    formId: { type: String, required: true },
    publicKey: { type: String, default: undefined },
    initialSchema: { type: Object as PropType<FormSchema>, default: undefined },
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
  setup(props, { slots }) {
    const state = useFormRelay({
      formId: props.formId,
      publicKey: props.publicKey,
      initialSchema: props.initialSchema,
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
