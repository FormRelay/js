import { describe, expect, test, vi } from "vitest";
import { BotProtectionError, FormRelayError, HoneypotError } from "./errors";
import type { HttpAdapter, HttpResponse } from "./http/types";
import { submitForm } from "./submit";
import type { FormSchema } from "./types";

function createMockHttpClient(response: HttpResponse): HttpAdapter {
  return {
    get: vi.fn(async (): Promise<HttpResponse> => {
      throw new Error("unexpected GET");
    }),
    post: vi.fn(async (): Promise<HttpResponse> => response),
  };
}

const BASE_SCHEMA: FormSchema = {
  id: "01abc",
  name: "Contact Form",
  isActive: true,
  fields: [
    {
      name: "email",
      label: "Email",
      type: "email",
      isRequired: true,
      htmlInputType: "email",
      options: null,
      helpText: null,
      order: 0,
    },
  ],
  validationSchema: {},
  honeypotField: null,
  botProtection: null,
  submitUrl: "https://formrelay.app/api/v1/form/01abc",
};

describe("submitForm", () => {
  test("sends POST to submit_url with form data", async () => {
    const client = createMockHttpClient({
      status: 200,
      headers: { get: () => null },
      json: () => Promise.resolve({ message: "Form submitted successfully." }),
    });

    const result = await submitForm({ email: "john@example.com" }, BASE_SCHEMA, client);

    expect(client.post).toHaveBeenCalledWith(
      "https://formrelay.app/api/v1/form/01abc",
      { email: "john@example.com" },
      { headers: {} },
    );
    expect(result).toEqual({
      success: true,
      message: "Form submitted successfully.",
    });
  });

  test("injects honeypot field as empty string", async () => {
    const schema: FormSchema = {
      ...BASE_SCHEMA,
      honeypotField: "_hp_phone",
    };

    const client = createMockHttpClient({
      status: 200,
      headers: { get: () => null },
      json: () => Promise.resolve({ message: "Form submitted successfully." }),
    });

    await submitForm({ email: "john@example.com" }, schema, client);

    expect(client.post).toHaveBeenCalledWith(
      expect.any(String),
      { email: "john@example.com", _hp_phone: "" },
      expect.any(Object),
    );
  });

  test("injects Turnstile token with correct field name", async () => {
    const schema: FormSchema = {
      ...BASE_SCHEMA,
      botProtection: { type: "turnstile", siteKey: "0x-key" },
    };

    const client = createMockHttpClient({
      status: 200,
      headers: { get: () => null },
      json: () => Promise.resolve({ message: "OK" }),
    });

    await submitForm({ email: "john@example.com" }, schema, client, {
      botToken: "turnstile-token-123",
    });

    expect(client.post).toHaveBeenCalledWith(
      expect.any(String),
      {
        email: "john@example.com",
        "cf-turnstile-response": "turnstile-token-123",
      },
      expect.any(Object),
    );
  });

  test("injects reCAPTCHA v2 token with correct field name", async () => {
    const schema: FormSchema = {
      ...BASE_SCHEMA,
      botProtection: { type: "recaptcha_v2", siteKey: "key" },
    };

    const client = createMockHttpClient({
      status: 200,
      headers: { get: () => null },
      json: () => Promise.resolve({ message: "OK" }),
    });

    await submitForm({ email: "john@example.com" }, schema, client, {
      botToken: "recaptcha-token",
    });

    expect(client.post).toHaveBeenCalledWith(
      expect.any(String),
      {
        email: "john@example.com",
        "g-recaptcha-response": "recaptcha-token",
      },
      expect.any(Object),
    );
  });

  test("injects reCAPTCHA v3 token with correct field name", async () => {
    const schema: FormSchema = {
      ...BASE_SCHEMA,
      botProtection: { type: "recaptcha_v3", siteKey: "key" },
    };

    const client = createMockHttpClient({
      status: 200,
      headers: { get: () => null },
      json: () => Promise.resolve({ message: "OK" }),
    });

    await submitForm({ email: "john@example.com" }, schema, client, {
      botToken: "v3-token",
    });

    expect(client.post).toHaveBeenCalledWith(
      expect.any(String),
      {
        email: "john@example.com",
        "g-recaptcha-response": "v3-token",
      },
      expect.any(Object),
    );
  });

  test("returns error result on honeypot rejection", async () => {
    const client = createMockHttpClient({
      status: 422,
      headers: { get: () => null },
      json: () =>
        Promise.resolve({
          type: "https://formrelay.app/errors#honeypot-detected",
          title: "Spam Detected",
          detail: "Security check failed.",
        }),
    });

    const result = await submitForm({ email: "john@example.com" }, BASE_SCHEMA, client);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(HoneypotError);
    }
  });

  test("returns error result on bot protection failure", async () => {
    const client = createMockHttpClient({
      status: 422,
      headers: { get: () => null },
      json: () =>
        Promise.resolve({
          type: "https://formrelay.app/errors#bot-protection-failed",
          title: "Bot Protection Failed",
          detail: "Security check failed.",
        }),
    });

    const result = await submitForm({ email: "john@example.com" }, BASE_SCHEMA, client);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(BotProtectionError);
    }
  });

  test("returns generic error for server errors", async () => {
    const client = createMockHttpClient({
      status: 500,
      headers: { get: () => null },
      json: () =>
        Promise.resolve({
          type: "https://formrelay.app/errors#server",
          title: "Server Error",
          detail: "Internal server error.",
        }),
    });

    const result = await submitForm({ email: "john@example.com" }, BASE_SCHEMA, client);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(FormRelayError);
      expect(result.error.status).toBe(500);
    }
  });

  test("does not inject bot token when no botProtection in schema", async () => {
    const client = createMockHttpClient({
      status: 200,
      headers: { get: () => null },
      json: () => Promise.resolve({ message: "OK" }),
    });

    await submitForm({ email: "john@example.com" }, BASE_SCHEMA, client, {
      botToken: "some-token",
    });

    expect(client.post).toHaveBeenCalledWith(
      expect.any(String),
      { email: "john@example.com" },
      expect.any(Object),
    );
  });

  test("does not mutate original data object", async () => {
    const schema: FormSchema = {
      ...BASE_SCHEMA,
      honeypotField: "_hp_phone",
      botProtection: { type: "turnstile", siteKey: "key" },
    };

    const client = createMockHttpClient({
      status: 200,
      headers: { get: () => null },
      json: () => Promise.resolve({ message: "OK" }),
    });

    const data = { email: "john@example.com" };
    await submitForm(data, schema, client, { botToken: "token" });

    expect(data).toEqual({ email: "john@example.com" });
  });

  test("returns error result when server returns non-JSON error", async () => {
    const client = createMockHttpClient({
      status: 502,
      headers: { get: () => null },
      json: () => Promise.reject(new SyntaxError("Unexpected token <")),
    });

    const result = await submitForm({ email: "john@example.com" }, BASE_SCHEMA, client);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(FormRelayError);
      expect(result.error.status).toBe(502);
      expect(result.error.detail).toContain("HTTP 502");
    }
  });

  test("throws on unknown bot protection type", async () => {
    const schema: FormSchema = {
      ...BASE_SCHEMA,
      botProtection: { type: "unknown_type" as any, siteKey: "key" },
    };

    const client = createMockHttpClient({
      status: 200,
      headers: { get: () => null },
      json: () => Promise.resolve({ message: "OK" }),
    });

    await expect(
      submitForm({ email: "john@example.com" }, schema, client, { botToken: "token" }),
    ).rejects.toThrow('Unknown bot protection type "unknown_type"');
  });
});
