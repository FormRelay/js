import { defineComponent, toRef } from "vue";
import { useFormRelay } from "../composables/useFormRelay";
import { renderFormRelay } from "./renderFormRelay";
import type { UseFormRelayOptions } from "../types";

export default defineComponent({
  name: "FormRelay",
  props: {
    formId: { type: String, required: true },
    publicKey: { type: String, default: undefined },
    initialSchema: { type: Object, default: undefined },
    botProtectionContainer: { type: Object, default: undefined },
    validate: { type: Function, default: undefined },
    onSuccess: { type: Function, default: undefined },
    onError: { type: Function, default: undefined },
  },
  setup(props, { slots }) {
    const state = useFormRelay({
      formId: props.formId,
      publicKey: props.publicKey,
      initialSchema: props.initialSchema,
      botProtectionContainer: toRef(props, "botProtectionContainer"),
      validate: props.validate,
      onSuccess: props.onSuccess,
      onError: props.onError,
    } as UseFormRelayOptions);

    return () => renderFormRelay(state, slots);
  },
});
