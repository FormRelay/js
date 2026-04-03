import { defineComponent, toRef } from "vue";
import { renderFormRelay } from "@formrelay/vue";
import { useFormRelay } from "../composables/useFormRelay";

export default defineComponent({
  name: "FormRelay",
  props: {
    formId: { type: String, required: true },
    publicKey: { type: String, default: undefined },
    botProtectionContainer: { type: Object, default: undefined },
    validate: { type: Function, default: undefined },
    onSuccess: { type: Function, default: undefined },
    onError: { type: Function, default: undefined },
  },
  async setup(props, { slots }) {
    const state = await useFormRelay({
      formId: props.formId,
      publicKey: props.publicKey,
      botProtectionContainer: toRef(props, "botProtectionContainer"),
      validate: props.validate,
      onSuccess: props.onSuccess,
      onError: props.onError,
    });

    return () => renderFormRelay(state, slots);
  },
});
