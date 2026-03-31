import type { HttpAdapter } from "./http/types";
import type { FormSchema, SubmitOptions } from "./types";
import { type FormRelayError, parseErrorResponse } from "./errors";

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
  const body: Record<string, unknown> = { ...data };

  if (schema.honeypotField) {
    body[schema.honeypotField] = "";
  }

  if (options?.botToken && schema.botProtection) {
    const tokenField = BOT_TOKEN_FIELDS[schema.botProtection.type];
    if (tokenField) {
      body[tokenField] = options.botToken;
    }
  }

  const response = await httpClient.post(schema.submitUrl, body, {
    headers: {},
  });

  if (response.status >= 200 && response.status < 300) {
    const json = (await response.json()) as { message: string };
    return { success: true, message: json.message };
  }

  const errorBody = (await response.json()) as Record<string, unknown>;
  return {
    success: false,
    error: parseErrorResponse(errorBody, response.status),
  };
}
