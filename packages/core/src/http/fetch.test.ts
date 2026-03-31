import { afterEach, describe, expect, test, vi } from "vitest";
import { createFetchAdapter } from "./fetch";

describe("createFetchAdapter", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("GET request sends correct method and headers", async () => {
    const mockResponse = {
      status: 200,
      headers: new Headers({ etag: '"abc123"' }),
      json: () => Promise.resolve({ data: "test" }),
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse));

    const adapter = createFetchAdapter();
    const response = await adapter.get("https://api.example.com/test", {
      headers: { "X-Custom": "value" },
    });

    expect(fetch).toHaveBeenCalledWith("https://api.example.com/test", {
      method: "GET",
      headers: { "X-Custom": "value" },
    });
    expect(response.status).toBe(200);
    expect(response.headers.get("etag")).toBe('"abc123"');
    expect(await response.json()).toEqual({ data: "test" });
  });

  test("POST request sends JSON body with content-type header", async () => {
    const mockResponse = {
      status: 200,
      headers: new Headers(),
      json: () => Promise.resolve({ message: "OK" }),
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse));

    const adapter = createFetchAdapter();
    await adapter.post(
      "https://api.example.com/submit",
      { email: "test@example.com" },
      { headers: {} },
    );

    expect(fetch).toHaveBeenCalledWith("https://api.example.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: '{"email":"test@example.com"}',
    });
  });

  test("POST merges custom headers with content-type", async () => {
    const mockResponse = {
      status: 200,
      headers: new Headers(),
      json: () => Promise.resolve({}),
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse));

    const adapter = createFetchAdapter();
    await adapter.post("https://api.example.com/submit", {}, {
      headers: { "X-Custom": "value" },
    });

    expect(fetch).toHaveBeenCalledWith("https://api.example.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Custom": "value" },
      body: "{}",
    });
  });
});
