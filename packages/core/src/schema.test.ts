import { describe, expect, test, vi } from "vitest";
import type { HttpAdapter, HttpResponse } from "./http/types";
import { createSchemaFetcher } from "./schema";

function createMockHttpClient(
  responses: HttpResponse[],
): HttpAdapter {
  let callIndex = 0;
  return {
    get: vi.fn(async (): Promise<HttpResponse> => {
      return responses[callIndex++]!;
    }),
    post: vi.fn(async (): Promise<HttpResponse> => {
      throw new Error("unexpected POST");
    }),
  };
}

const RAW_SCHEMA_RESPONSE = {
  data: {
    id: "01abc",
    name: "Contact Form",
    is_active: true,
    fields: [
      {
        name: "email",
        label: "Email Address",
        type: "email",
        is_required: true,
        html_input_type: "email",
        options: null,
        help_text: "Your email",
        order: 0,
      },
      {
        name: "subject",
        label: "Subject",
        type: "select",
        is_required: false,
        html_input_type: "select",
        options: [
          { label: "General", value: "general" },
          { label: "Support", value: "support" },
        ],
        help_text: null,
        order: 1,
      },
    ],
    validation_schema: {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      type: "object",
      properties: { email: { type: "string", format: "email" } },
      required: ["email"],
    },
    honeypot_field: "_hp_phone",
    bot_protection: {
      type: "turnstile",
      site_key: "0x-test-key",
    },
    submit_url: "https://formrelay.app/api/v1/form/01abc",
  },
};

describe("createSchemaFetcher", () => {
  test("sends GET with public key header", async () => {
    const client = createMockHttpClient([
      {
        status: 200,
        headers: { get: () => null },
        json: () => Promise.resolve(RAW_SCHEMA_RESPONSE),
      },
    ]);

    const getSchema = createSchemaFetcher(
      "01abc",
      "https://formrelay.app",
      "pk_fr_test",
      client,
    );
    await getSchema();

    expect(client.get).toHaveBeenCalledWith(
      "https://formrelay.app/api/v1/form/01abc/schema",
      expect.objectContaining({
        headers: expect.objectContaining({
          "X-Form-Public-Key": "pk_fr_test",
        }),
      }),
    );
  });

  test("transforms snake_case response to camelCase", async () => {
    const client = createMockHttpClient([
      {
        status: 200,
        headers: { get: () => null },
        json: () => Promise.resolve(RAW_SCHEMA_RESPONSE),
      },
    ]);

    const getSchema = createSchemaFetcher(
      "01abc",
      "https://formrelay.app",
      "pk_fr_test",
      client,
    );
    const schema = await getSchema();

    expect(schema.id).toBe("01abc");
    expect(schema.name).toBe("Contact Form");
    expect(schema.isActive).toBe(true);
    expect(schema.honeypotField).toBe("_hp_phone");
    expect(schema.submitUrl).toBe(
      "https://formrelay.app/api/v1/form/01abc",
    );
    expect(schema.botProtection).toEqual({
      type: "turnstile",
      siteKey: "0x-test-key",
    });
    expect(schema.fields[0]).toEqual({
      name: "email",
      label: "Email Address",
      type: "email",
      isRequired: true,
      htmlInputType: "email",
      options: null,
      helpText: "Your email",
      order: 0,
    });
    expect(schema.fields[1]!.options).toEqual([
      { label: "General", value: "general" },
      { label: "Support", value: "support" },
    ]);
    expect(schema.validationSchema).toEqual(
      RAW_SCHEMA_RESPONSE.data.validation_schema,
    );
  });

  test("handles null honeypot and bot protection", async () => {
    const response = structuredClone(RAW_SCHEMA_RESPONSE);
    response.data.honeypot_field = null as any;
    response.data.bot_protection = null as any;

    const client = createMockHttpClient([
      {
        status: 200,
        headers: { get: () => null },
        json: () => Promise.resolve(response),
      },
    ]);

    const getSchema = createSchemaFetcher(
      "01abc",
      "https://formrelay.app",
      "pk_fr_test",
      client,
    );
    const schema = await getSchema();

    expect(schema.honeypotField).toBeNull();
    expect(schema.botProtection).toBeNull();
  });

  test("sends ETag on second request and returns cached on 304", async () => {
    const headerMap = new Map([
      ["etag", '"v1"'],
      ["last-modified", "Mon, 01 Jan 2026 00:00:00 GMT"],
    ]);

    const client = createMockHttpClient([
      {
        status: 200,
        headers: { get: (name: string) => headerMap.get(name) ?? null },
        json: () => Promise.resolve(RAW_SCHEMA_RESPONSE),
      },
      {
        status: 304,
        headers: { get: () => null },
        json: () => Promise.reject(new Error("should not be called")),
      },
    ]);

    const getSchema = createSchemaFetcher(
      "01abc",
      "https://formrelay.app",
      "pk_fr_test",
      client,
    );

    const first = await getSchema();
    const second = await getSchema();

    expect(first).toEqual(second);
    expect(client.get).toHaveBeenCalledTimes(2);

    const secondCallHeaders = (client.get as ReturnType<typeof vi.fn>).mock
      .calls[1]![1].headers;
    expect(secondCallHeaders["If-None-Match"]).toBe('"v1"');
    expect(secondCallHeaders["If-Modified-Since"]).toBe(
      "Mon, 01 Jan 2026 00:00:00 GMT",
    );
  });
});
