import type { HttpAdapter } from "./http/types";
import { parseJsonSafe } from "./http/parse-json";
import type { BotProtection, FormField, FormSchema } from "./types";
import { FormRelayError, parseErrorResponse } from "./errors";

interface SchemaCache {
  etag: string | null;
  lastModified: string | null;
  schema: FormSchema;
}

interface RawSchemaResponse {
  data: {
    id: string;
    name: string;
    is_active: boolean;
    columns: number;
    fields: RawFormField[];
    validation_schema: Record<string, unknown>;
    honeypot_field: string | null;
    bot_protection: { type: string; site_key: string } | null;
    submit_url: string;
  };
}

interface RawFormField {
  name: string;
  label: string;
  type: string;
  is_required: boolean;
  html_input_type: string;
  options: { label: string; value: string }[] | null;
  help_text: string | null;
  order: number;
  column_span: number;
}

export function createSchemaFetcher(
  formId: string,
  baseUrl: string,
  publicKey: string,
  httpClient: HttpAdapter,
): () => Promise<FormSchema> {
  let cache: SchemaCache | null = null;

  return async function getSchema(): Promise<FormSchema> {
    const url = `${baseUrl}/api/v1/form/${formId}/schema`;
    const headers: Record<string, string> = {
      "X-Form-Public-Key": publicKey,
    };

    if (cache?.etag) {
      headers["If-None-Match"] = cache.etag;
    }
    if (cache?.lastModified) {
      headers["If-Modified-Since"] = cache.lastModified;
    }

    const response = await httpClient.get(url, { headers });

    if (response.status === 304 && cache) {
      return cache.schema;
    }

    if (response.status < 200 || response.status >= 300) {
      const errorBody = await parseJsonSafe(response);
      if (!errorBody) {
        throw new FormRelayError({
          type: "",
          title: "Schema Fetch Failed",
          status: response.status,
          detail: `Failed to fetch form schema: server returned HTTP ${response.status}`,
        });
      }
      throw parseErrorResponse(errorBody, response.status);
    }

    const body = (await response.json()) as RawSchemaResponse;
    const schema = transformSchema(body.data);

    cache = {
      etag: response.headers.get("etag"),
      lastModified: response.headers.get("last-modified"),
      schema,
    };

    return schema;
  };
}

function transformSchema(raw: RawSchemaResponse["data"]): FormSchema {
  return {
    id: raw.id,
    name: raw.name,
    isActive: raw.is_active,
    columns: raw.columns,
    fields: raw.fields.map(transformField),
    validationSchema: raw.validation_schema,
    honeypotField: raw.honeypot_field,
    botProtection: raw.bot_protection
      ? {
          type: raw.bot_protection.type as BotProtection["type"],
          siteKey: raw.bot_protection.site_key,
        }
      : null,
    submitUrl: raw.submit_url,
  };
}

function transformField(raw: RawFormField): FormField {
  return {
    name: raw.name,
    label: raw.label,
    type: raw.type,
    isRequired: raw.is_required,
    htmlInputType: raw.html_input_type,
    options: raw.options,
    helpText: raw.help_text,
    order: raw.order,
    columnSpan: raw.column_span,
  };
}
