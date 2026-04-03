import type { Slots, VNode } from "vue";
import type { UseFormRelayReturn } from "../types";

export function renderFormRelay(state: UseFormRelayReturn, slots: Slots): VNode | VNode[] | null {
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
}
