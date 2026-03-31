import type { HttpAdapter } from "./http/types";
import type { FormSchema, SubmitOptions } from "./types";
import type { SubmitResult } from "./submit";
import { createFetchAdapter } from "./http/fetch";
import { createSchemaFetcher } from "./schema";
import { submitForm } from "./submit";

export interface FormClientOptions {
  publicKey: string;
  baseUrl?: string;
  httpClient?: HttpAdapter;
}

export interface FormClient {
  getSchema(): Promise<FormSchema>;
  submit(data: Record<string, unknown>, options?: SubmitOptions): Promise<SubmitResult>;
}

export function createForm(formId: string, options: FormClientOptions): FormClient {
  const baseUrl = options.baseUrl ?? "https://formrelay.app";
  const httpClient = options.httpClient ?? createFetchAdapter();
  const fetchSchema = createSchemaFetcher(formId, baseUrl, options.publicKey, httpClient);

  let cachedSchema: FormSchema | null = null;

  return {
    async getSchema() {
      cachedSchema = await fetchSchema();
      return cachedSchema;
    },

    async submit(data: Record<string, unknown>, submitOptions?: SubmitOptions) {
      if (!cachedSchema) {
        cachedSchema = await fetchSchema();
      }
      return submitForm(data, cachedSchema, httpClient, submitOptions);
    },
  };
}
