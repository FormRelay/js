import type { HttpAdapter } from "./http/types";
import { parseJsonSafe } from "./http/parse-json";
import type { FormSchema, SubmitOptions } from "./types";
import { FormRelayError, parseErrorResponse } from "./errors";

const BOT_TOKEN_FIELDS: Record<string, string> = {
  turnstile: "cf-turnstile-response",
  recaptcha_v2: "g-recaptcha-response",
  recaptcha_v3: "g-recaptcha-response",
};

export type SubmitResult =
  | { success: true; message: string }
  | { success: false; error: FormRelayError };

export async function submitForm(
  data: Record<string, unknown>,
  schema: FormSchema,
  httpClient: HttpAdapter,
  options?: SubmitOptions,
): Promise<SubmitResult> {
  const body = buildRequestBody(data, schema, options);

  const response = await httpClient.post(schema.submitUrl, body, {
    headers: {},
  });

  if (response.status >= 200 && response.status < 300) {
    const json = await parseJsonSafe(response);
    return {
      success: true,
      message: (json?.message as string) ?? "Form submitted successfully.",
    };
  }

  const errorBody = await parseJsonSafe(response);
  if (!errorBody) {
    return {
      success: false,
      error: new FormRelayError({
        type: "",
        title: "Submission Failed",
        status: response.status,
        detail: `Form submission failed with HTTP ${response.status}`,
      }),
    };
  }

  return {
    success: false,
    error: parseErrorResponse(errorBody, response.status),
  };
}

function buildRequestBody(
  data: Record<string, unknown>,
  schema: FormSchema,
  options?: SubmitOptions,
): Record<string, unknown> {
  const body: Record<string, unknown> = { ...data };

  if (schema.honeypotField) {
    body[schema.honeypotField] = "";
  }

  if (!options?.botToken || !schema.botProtection) {
    return body;
  }

  const tokenField = BOT_TOKEN_FIELDS[schema.botProtection.type];
  if (!tokenField) {
    throw new Error(
      `Unknown bot protection type "${schema.botProtection.type}". ` +
        `Supported types: ${Object.keys(BOT_TOKEN_FIELDS).join(", ")}`,
    );
  }

  body[tokenField] = options.botToken;
  return body;
}
