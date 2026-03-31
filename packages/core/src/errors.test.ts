import { describe, expect, test } from "vitest";
import {
  BotProtectionError,
  FormRelayError,
  HoneypotError,
  parseErrorResponse,
  RateLimitError,
  ValidationError,
} from "./errors";

describe("FormRelayError", () => {
  test("creates error with RFC 9457 fields", () => {
    const error = new FormRelayError({
      type: "https://formrelay.app/errors#generic",
      title: "Error",
      status: 500,
      detail: "Something went wrong",
    });

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(FormRelayError);
    expect(error.message).toBe("Something went wrong");
    expect(error.type).toBe("https://formrelay.app/errors#generic");
    expect(error.title).toBe("Error");
    expect(error.status).toBe(500);
    expect(error.detail).toBe("Something went wrong");
    expect(error.name).toBe("FormRelayError");
  });
});

describe("HoneypotError", () => {
  test("is instanceof FormRelayError", () => {
    const error = new HoneypotError({
      type: "https://formrelay.app/errors#honeypot-detected",
      title: "Spam Detected",
      status: 422,
      detail: "Security check failed.",
    });

    expect(error).toBeInstanceOf(FormRelayError);
    expect(error).toBeInstanceOf(HoneypotError);
    expect(error.name).toBe("HoneypotError");
  });
});

describe("ValidationError", () => {
  test("includes field errors", () => {
    const error = new ValidationError({
      type: "https://formrelay.app/errors#validation",
      title: "Validation Failed",
      status: 422,
      detail: "The given data was invalid.",
      fieldErrors: {
        email: ["The email field is required."],
        name: ["The name field must be a string."],
      },
    });

    expect(error).toBeInstanceOf(FormRelayError);
    expect(error).toBeInstanceOf(ValidationError);
    expect(error.fieldErrors).toEqual({
      email: ["The email field is required."],
      name: ["The name field must be a string."],
    });
  });
});

describe("parseErrorResponse", () => {
  test("parses honeypot error", () => {
    const error = parseErrorResponse(
      {
        type: "https://formrelay.app/errors#honeypot-detected",
        title: "Spam Detected",
        detail: "Security check failed.",
      },
      422,
    );

    expect(error).toBeInstanceOf(HoneypotError);
    expect(error.status).toBe(422);
  });

  test("parses bot protection error", () => {
    const error = parseErrorResponse(
      {
        type: "https://formrelay.app/errors#bot-protection-failed",
        title: "Bot Protection Failed",
        detail: "Security check failed.",
      },
      422,
    );

    expect(error).toBeInstanceOf(BotProtectionError);
  });

  test("parses validation error with field errors", () => {
    const error = parseErrorResponse(
      {
        type: "https://formrelay.app/errors#validation",
        title: "Validation Failed",
        detail: "The given data was invalid.",
        errors: { email: ["Required."] },
      },
      422,
    );

    expect(error).toBeInstanceOf(ValidationError);
    expect((error as ValidationError).fieldErrors).toEqual({
      email: ["Required."],
    });
  });

  test("parses rate limit error", () => {
    const error = parseErrorResponse(
      {
        type: "https://formrelay.app/errors#rate-limited",
        title: "Too Many Requests",
        detail: "Please wait before submitting again.",
      },
      429,
    );

    expect(error).toBeInstanceOf(RateLimitError);
  });

  test("falls back to generic FormRelayError for unknown types", () => {
    const error = parseErrorResponse(
      {
        type: "https://formrelay.app/errors#unknown",
        title: "Unknown",
        detail: "Something happened.",
      },
      500,
    );

    expect(error).toBeInstanceOf(FormRelayError);
    expect(error).not.toBeInstanceOf(HoneypotError);
    expect(error).not.toBeInstanceOf(BotProtectionError);
    expect(error).not.toBeInstanceOf(ValidationError);
    expect(error).not.toBeInstanceOf(RateLimitError);
  });
});
