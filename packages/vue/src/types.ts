import type {
  BotProtection,
  FormField,
  FormRelayError,
  FormSchema,
  JsonSchema,
} from "@formrelay/core";
import type { ComputedRef, Ref } from "vue";

export interface UseFormRelayOptions {
  formId: string;
  publicKey: string;
  initialSchema?: FormSchema;
  botProtectionContainer?: Ref<HTMLElement | null>;
  validate?: (data: Record<string, unknown>, schema: JsonSchema) => Record<string, string[]>;
  onSuccess?: (result: { message: string }) => void;
  onError?: (error: FormRelayError) => void;
}

export interface UseFormRelayReturn {
  schema: Ref<FormSchema | null>;
  fields: ComputedRef<FormField[]>;
  schemaLoading: Ref<boolean>;
  schemaError: Ref<FormRelayError | null>;

  values: Record<string, unknown>;
  errors: Ref<Record<string, string[]>>;

  submitting: Ref<boolean>;
  submitted: Ref<boolean>;
  canSubmit: ComputedRef<boolean>;

  submit: () => Promise<void>;
  reset: () => void;
  setBotToken: (token: string) => void;

  validationSchema: ComputedRef<JsonSchema | null>;
  botProtection: ComputedRef<BotProtection | null>;
}
