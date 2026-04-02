export type JsonSchema = Record<string, unknown>;

export interface FormSchema {
  id: string;
  name: string;
  isActive: boolean;
  columns: number;
  fields: FormField[];
  validationSchema: JsonSchema;
  honeypotField: string | null;
  botProtection: BotProtection | null;
  submitUrl: string;
}

export interface FormField {
  name: string;
  label: string;
  type: string;
  isRequired: boolean;
  htmlInputType: string;
  options: FieldOption[] | null;
  helpText: string | null;
  order: number;
  columnSpan: number;
}

export interface FieldOption {
  label: string;
  value: string;
}

export interface BotProtection {
  type: "turnstile" | "recaptcha_v2" | "recaptcha_v3";
  siteKey: string;
}

export interface SubmitOptions {
  botToken?: string;
}
