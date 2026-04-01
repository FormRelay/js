import { defineComponent } from "vue";
import { useFormRelay } from "../composables/useFormRelay";
import type { UseFormRelayOptions } from "../types";

export default defineComponent({
  name: "FormRelay",
  props: {
    formId: { type: String, required: true },
    publicKey: { type: String, required: true },
    validate: { type: Function, default: undefined },
    onSuccess: { type: Function, default: undefined },
    onError: { type: Function, default: undefined },
  },
  setup(props, { slots }) {
    const state = useFormRelay(props as unknown as UseFormRelayOptions);

    return () => {
      if (!slots.default) return null;

      return slots.default({
        schema: state.schema.value,
        fields: state.fields.value,
        schemaLoading: state.schemaLoading.value,
        schemaError: state.schemaError.value,
        values: state.values,
        errors: state.errors.value,
        submitting: state.submitting.value,
        submitted: state.submitted.value,
        canSubmit: state.canSubmit.value,
        submit: state.submit,
        reset: state.reset,
        setBotToken: state.setBotToken,
        validationSchema: state.validationSchema.value,
        botProtection: state.botProtection.value,
      });
    };
  },
});
