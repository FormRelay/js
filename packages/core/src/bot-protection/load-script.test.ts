/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, test } from "vitest";
import { loadScript } from "./load-script";

describe("loadScript", () => {
  afterEach(() => {
    document.head.querySelectorAll("script").forEach((s) => s.remove());
  });

  test("appends script tag to document head", async () => {
    const promise = loadScript("https://example.com/script.js");

    const script = document.querySelector(
      'script[src="https://example.com/script.js"]',
    ) as HTMLScriptElement;
    expect(script).not.toBeNull();
    expect(script.async).toBe(true);

    script.onload!(new Event("load"));
    await promise;
  });

  test("reuses existing loaded script", async () => {
    const script = document.createElement("script");
    script.src = "https://example.com/existing.js";
    script.dataset.loaded = "true";
    document.head.appendChild(script);

    await loadScript("https://example.com/existing.js");

    const scripts = document.querySelectorAll('script[src="https://example.com/existing.js"]');
    expect(scripts.length).toBe(1);
  });

  test("rejects on load error and removes script from DOM", async () => {
    const promise = loadScript("https://example.com/bad.js");

    const script = document.querySelector(
      'script[src="https://example.com/bad.js"]',
    ) as HTMLScriptElement;
    script.onerror!(new Event("error"));

    await expect(promise).rejects.toThrow("Failed to load script");

    const remaining = document.querySelector('script[src="https://example.com/bad.js"]');
    expect(remaining).toBeNull();
  });
});
