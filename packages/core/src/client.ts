import type { HttpAdapter } from "./http/types";
import type { FormSchema, SubmitOptions } from "./types";
import type { SubmitResult } from "./submit";
import { createFetchAdapter } from "./http/fetch";
import { createSchemaFetcher } from "./schema";
import { submitForm } from "./submit";
import { API_BASE_URL } from "./constants";

export interface FormClientOptions {
  publicKey: string;
  httpClient?: HttpAdapter;
}

export interface FormClient {
  getSchema(): Promise<FormSchema>;
  submit(data: Record<string, unknown>, options?: SubmitOptions): Promise<SubmitResult>;
}

export function createForm(formId: string, options: FormClientOptions): FormClient {
  const httpClient = options.httpClient ?? createFetchAdapter();
  const fetchSchema = createSchemaFetcher(formId, API_BASE_URL, options.publicKey, httpClient);

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
