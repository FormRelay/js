/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { loadRecaptchaV2 } from "./recaptcha-v2";

describe("loadRecaptchaV2", () => {
  let capturedCallback: ((token: string) => void) | null = null;

  beforeEach(() => {
    capturedCallback = null;

    (window as any).grecaptcha = {
      render: vi.fn(
        (
          _container: HTMLElement,
          opts: { callback: (t: string) => void },
        ) => {
          capturedCallback = opts.callback;
          return 0;
        },
      ),
      reset: vi.fn(),
      getResponse: vi.fn(() => ""),
    };

    const script = document.createElement("script");
    script.src =
      "https://www.google.com/recaptcha/api.js?render=explicit";
    script.dataset.loaded = "true";
    document.head.appendChild(script);
  });

  afterEach(() => {
    delete (window as any).grecaptcha;
    document.head.querySelectorAll("script").forEach((s) => s.remove());
  });

  test("renders widget with site key", async () => {
    const container = document.createElement("div");
    await loadRecaptchaV2({ siteKey: "6Le-test", container });

    expect(window.grecaptcha.render).toHaveBeenCalledWith(
      container,
      expect.objectContaining({ sitekey: "6Le-test" }),
    );
  });

  test("getToken resolves when callback fires", async () => {
    const container = document.createElement("div");
    const widget = await loadRecaptchaV2({ siteKey: "6Le-test", container });

    const tokenPromise = widget.getToken();
    capturedCallback!("recaptcha-token");

    expect(await tokenPromise).toBe("recaptcha-token");
  });

  test("reset clears token and calls grecaptcha.reset", async () => {
    const container = document.createElement("div");
    const widget = await loadRecaptchaV2({ siteKey: "6Le-test", container });

    capturedCallback!("token");
    widget.reset();

    expect(window.grecaptcha.reset).toHaveBeenCalledWith(0);
  });

  test("remove clears container children", async () => {
    const container = document.createElement("div");
    container.appendChild(document.createElement("div"));
    const widget = await loadRecaptchaV2({ siteKey: "6Le-test", container });

    widget.remove();

    expect(container.childNodes.length).toBe(0);
  });
});
