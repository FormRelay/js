import type { HttpAdapter } from "./http/types";
import type { BotProtection, FormSchema, SubmitOptions } from "./types";
import type { SubmitConfig, SubmitResult } from "./submit";
import { createFetchAdapter } from "./http/fetch";
import { createSchemaFetcher } from "./schema";
import { submitForm } from "./submit";
import { API_BASE_URL } from "./constants";

export interface FormClientOptions {
  publicKey?: string;
  httpClient?: HttpAdapter;
  botProtection?: BotProtection;
  honeypotField?: string;
}

export interface FormClient {
  getSchema(): Promise<FormSchema>;
  submit(data: Record<string, unknown>, options?: SubmitOptions): Promise<SubmitResult>;
}

export function createForm(formId: string, options: FormClientOptions = {}): FormClient {
  const httpClient = options.httpClient ?? createFetchAdapter();

  const fetchSchema = options.publicKey
    ? createSchemaFetcher(formId, API_BASE_URL, options.publicKey, httpClient)
    : null;

  let cachedSchema: FormSchema | null = null;

  function getSubmitConfig(): FormSchema | SubmitConfig {
    if (cachedSchema) return cachedSchema;

    return {
      submitUrl: `${API_BASE_URL}/api/v1/form/${formId}`,
      honeypotField: options.honeypotField,
      botProtection: options.botProtection,
    };
  }

  return {
    async getSchema() {
      if (!fetchSchema) {
        throw new Error("Cannot fetch schema without a publicKey");
      }
      cachedSchema = await fetchSchema();
      return cachedSchema;
    },

    async submit(data: Record<string, unknown>, submitOptions?: SubmitOptions) {
      if (!cachedSchema && fetchSchema) {
        cachedSchema = await fetchSchema();
      }
      return submitForm(data, getSubmitConfig(), httpClient, submitOptions);
    },
  };
}
