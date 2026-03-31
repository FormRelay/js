import type { HttpAdapter, HttpResponse, RequestOptions } from "./types";

export function createFetchAdapter(): HttpAdapter {
  return {
    async get(url: string, options: RequestOptions): Promise<HttpResponse> {
      const response = await fetch(url, {
        method: "GET",
        headers: options.headers,
      });
      return {
        status: response.status,
        headers: response.headers,
        json: () => response.json(),
      };
    },

    async post(url: string, body: unknown, options: RequestOptions): Promise<HttpResponse> {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        body: JSON.stringify(body),
      });
      return {
        status: response.status,
        headers: response.headers,
        json: () => response.json(),
      };
    },
  };
}
