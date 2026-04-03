import { defineComponent, toRef } from "vue";
import { useFormRelay } from "../composables/useFormRelay";
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

    return () => {
      if (state.schemaLoading.value && !state.schemaError.value && slots.loading) {
        return slots.loading();
      }

      if (state.schemaError.value && slots.error) {
        return slots.error({
          error: state.schemaError.value,
        });
      }

      if (!slots.default) return null;

      return slots.default({
        schema: state.schema.value,
        columns: state.columns.value,
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
