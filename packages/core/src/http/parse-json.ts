import type { HttpResponse } from "./types";

export async function parseJsonSafe(
  response: HttpResponse,
): Promise<Record<string, unknown> | null> {
  try {
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}
