export interface ErrorOptions {
  type: string;
  title: string;
  status: number;
  detail: string;
}

export class FormRelayError extends Error {
  type: string;
  title: string;
  status: number;
  detail: string;

  constructor(options: ErrorOptions) {
    super(options.detail);
    this.name = "FormRelayError";
    this.type = options.type;
    this.title = options.title;
    this.status = options.status;
    this.detail = options.detail;
  }
}

export class HoneypotError extends FormRelayError {
  constructor(options: ErrorOptions) {
    super(options);
    this.name = "HoneypotError";
  }
}

export class BotProtectionError extends FormRelayError {
  constructor(options: ErrorOptions) {
    super(options);
    this.name = "BotProtectionError";
  }
}

export class ValidationError extends FormRelayError {
  fieldErrors: Record<string, string[]>;

  constructor(options: ErrorOptions & { fieldErrors: Record<string, string[]> }) {
    super(options);
    this.name = "ValidationError";
    this.fieldErrors = options.fieldErrors;
  }
}

export class RateLimitError extends FormRelayError {
  constructor(options: ErrorOptions) {
    super(options);
    this.name = "RateLimitError";
  }
}

export function parseErrorResponse(body: Record<string, unknown>, status: number): FormRelayError {
  const type = (body.type as string) ?? "";
  const title = (body.title as string) ?? "Error";
  const detail = (body.detail as string) ?? `An error occurred (HTTP ${status})`;

  if (type.includes("#honeypot-detected")) {
    return new HoneypotError({ type, title, status, detail });
  }

  if (type.includes("#bot-protection-failed")) {
    return new BotProtectionError({ type, title, status, detail });
  }

  if (status === 422 && body.errors) {
    return new ValidationError({
      type,
      title,
      status,
      detail,
      fieldErrors: body.errors as Record<string, string[]>,
    });
  }

  if (status === 429) {
    return new RateLimitError({ type, title, status, detail });
  }

  return new FormRelayError({ type, title, status, detail });
}
