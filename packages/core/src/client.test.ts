import { describe, expect, test, vi } from "vitest";
import { createForm } from "./client";
import type { HttpAdapter, HttpResponse } from "./http/types";

const SCHEMA_RESPONSE = {
  data: {
    id: "01abc",
    name: "Test Form",
    is_active: true,
    fields: [
      {
        name: "email",
        label: "Email",
        type: "email",
        is_required: true,
        html_input_type: "email",
        options: null,
        help_text: null,
        order: 0,
      },
    ],
    validation_schema: { type: "object" },
    honeypot_field: "_hp_phone",
    bot_protection: { type: "turnstile", site_key: "0x-key" },
    submit_url: "https://formrelay.app/api/v1/form/01abc",
  },
};

function createMockHttpClient(): HttpAdapter {
  return {
    get: vi.fn(
      async (): Promise<HttpResponse> => ({
        status: 200,
        headers: { get: () => null },
        json: () => Promise.resolve(SCHEMA_RESPONSE),
      }),
    ),
    post: vi.fn(
      async (): Promise<HttpResponse> => ({
        status: 200,
        headers: { get: () => null },
        json: () => Promise.resolve({ message: "Form submitted successfully." }),
      }),
    ),
  };
}

describe("createForm", () => {
  test("getSchema returns transformed schema", async () => {
    const client = createMockHttpClient();
    const form = createForm("01abc", {
      publicKey: "pk_fr_test",
      httpClient: client,
    });

    const schema = await form.getSchema();

    expect(schema.id).toBe("01abc");
    expect(schema.isActive).toBe(true);
    expect(schema.honeypotField).toBe("_hp_phone");
    expect(schema.botProtection?.siteKey).toBe("0x-key");
  });

  test("submit fetches schema first if not cached", async () => {
    const client = createMockHttpClient();
    const form = createForm("01abc", {
      publicKey: "pk_fr_test",
      httpClient: client,
    });

    const result = await form.submit({ email: "test@example.com" });

    expect(client.get).toHaveBeenCalledTimes(1);
    expect(client.post).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(true);
  });

  test("submit reuses cached schema", async () => {
    const client = createMockHttpClient();
    const form = createForm("01abc", {
      publicKey: "pk_fr_test",
      httpClient: client,
    });

    await form.getSchema();
    await form.submit({ email: "test@example.com" });

    expect(client.get).toHaveBeenCalledTimes(1);
  });

  test("submit injects honeypot and bot token", async () => {
    const client = createMockHttpClient();
    const form = createForm("01abc", {
      publicKey: "pk_fr_test",
      httpClient: client,
    });

    await form.submit({ email: "test@example.com" }, { botToken: "turnstile-token" });

    expect(client.post).toHaveBeenCalledWith(
      "https://formrelay.app/api/v1/form/01abc",
      {
        email: "test@example.com",
        _hp_phone: "",
        "cf-turnstile-response": "turnstile-token",
      },
      { headers: {} },
    );
  });

  test("uses hardcoded API base URL", async () => {
    const client = createMockHttpClient();
    const form = createForm("01abc", {
      publicKey: "pk_fr_test",
      httpClient: client,
    });

    await form.getSchema();

    expect(client.get).toHaveBeenCalledWith(
      "https://formrelay.app/api/v1/form/01abc/schema",
      expect.any(Object),
    );
  });

  test("submit without publicKey uses constructed URL", async () => {
    const client = createMockHttpClient();
    const form = createForm("01abc", {
      httpClient: client,
    });

    await form.submit({ email: "test@example.com" });

    expect(client.get).not.toHaveBeenCalled();
    expect(client.post).toHaveBeenCalledWith(
      "https://formrelay.app/api/v1/form/01abc",
      { email: "test@example.com" },
      { headers: {} },
    );
  });

  test("submit without schema uses botProtection and honeypotField options", async () => {
    const client = createMockHttpClient();
    const form = createForm("01abc", {
      httpClient: client,
      botProtection: { type: "turnstile", siteKey: "0x-key" },
      honeypotField: "_hp_phone",
    });

    await form.submit({ email: "test@example.com" }, { botToken: "token-123" });

    expect(client.get).not.toHaveBeenCalled();
    expect(client.post).toHaveBeenCalledWith(
      "https://formrelay.app/api/v1/form/01abc",
      {
        email: "test@example.com",
        _hp_phone: "",
        "cf-turnstile-response": "token-123",
      },
      { headers: {} },
    );
  });

  test("schema values take precedence over options", async () => {
    const client = createMockHttpClient();
    const form = createForm("01abc", {
      publicKey: "pk_fr_test",
      httpClient: client,
      honeypotField: "_hp_custom",
    });

    await form.getSchema();
    await form.submit({ email: "test@example.com" });

    // Schema has honeypotField: "_hp_phone", options have "_hp_custom"
    // Schema should win
    expect(client.post).toHaveBeenCalledWith(
      "https://formrelay.app/api/v1/form/01abc",
      {
        email: "test@example.com",
        _hp_phone: "",
      },
      expect.any(Object),
    );
  });
});
