/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { loadTurnstile } from "./turnstile";

describe("loadTurnstile", () => {
  let capturedCallback: ((token: string) => void) | null = null;

  beforeEach(() => {
    capturedCallback = null;

    (window as any).turnstile = {
      render: vi.fn(
        (_container: HTMLElement, opts: { callback: (t: string) => void }) => {
          capturedCallback = opts.callback;
          return "widget-1";
        },
      ),
      reset: vi.fn(),
      remove: vi.fn(),
    };

    const script = document.createElement("script");
    script.src =
      "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.dataset.loaded = "true";
    document.head.appendChild(script);
  });

  afterEach(() => {
    delete (window as any).turnstile;
    document.head.querySelectorAll("script").forEach((s) => s.remove());
  });

  test("renders widget with site key", async () => {
    const container = document.createElement("div");
    await loadTurnstile({ siteKey: "0x-test", container });

    expect(window.turnstile.render).toHaveBeenCalledWith(
      container,
      expect.objectContaining({ sitekey: "0x-test" }),
    );
  });

  test("getToken resolves when callback fires", async () => {
    const container = document.createElement("div");
    const widget = await loadTurnstile({ siteKey: "0x-test", container });

    const tokenPromise = widget.getToken();
    capturedCallback!("test-token-123");

    expect(await tokenPromise).toBe("test-token-123");
  });

  test("getToken resolves immediately if token already available", async () => {
    const container = document.createElement("div");
    const widget = await loadTurnstile({ siteKey: "0x-test", container });

    capturedCallback!("cached-token");

    expect(await widget.getToken()).toBe("cached-token");
  });

  test("reset clears token and calls turnstile.reset", async () => {
    const container = document.createElement("div");
    const widget = await loadTurnstile({ siteKey: "0x-test", container });

    capturedCallback!("token");
    widget.reset();

    expect(window.turnstile.reset).toHaveBeenCalledWith("widget-1");
  });

  test("remove calls turnstile.remove", async () => {
    const container = document.createElement("div");
    const widget = await loadTurnstile({ siteKey: "0x-test", container });

    widget.remove();

    expect(window.turnstile.remove).toHaveBeenCalledWith("widget-1");
  });
});
