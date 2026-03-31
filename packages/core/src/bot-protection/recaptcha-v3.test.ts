/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { loadRecaptchaV3 } from "./recaptcha-v3";

describe("loadRecaptchaV3", () => {
  beforeEach(() => {
    (window as any).grecaptcha = {
      ready: vi.fn((cb: () => void) => cb()),
      execute: vi.fn(async () => "v3-token-123"),
    };
  });

  afterEach(() => {
    delete (window as any).grecaptcha;
    document.head.querySelectorAll("script").forEach((s) => s.remove());
  });

  test("loads script with siteKey in URL", async () => {
    const script = document.createElement("script");
    script.src = "https://www.google.com/recaptcha/api.js?render=6Le-v3-key";
    script.dataset.loaded = "true";
    document.head.appendChild(script);

    await loadRecaptchaV3({ siteKey: "6Le-v3-key" });

    expect(window.grecaptcha.ready).toHaveBeenCalled();
  });

  test("getToken calls execute with siteKey and action", async () => {
    const script = document.createElement("script");
    script.src = "https://www.google.com/recaptcha/api.js?render=6Le-v3-key";
    script.dataset.loaded = "true";
    document.head.appendChild(script);

    const widget = await loadRecaptchaV3({
      siteKey: "6Le-v3-key",
      action: "contact",
    });
    const token = await widget.getToken();

    expect(window.grecaptcha.execute).toHaveBeenCalledWith("6Le-v3-key", {
      action: "contact",
    });
    expect(token).toBe("v3-token-123");
  });

  test("defaults action to submit", async () => {
    const script = document.createElement("script");
    script.src = "https://www.google.com/recaptcha/api.js?render=6Le-v3-key";
    script.dataset.loaded = "true";
    document.head.appendChild(script);

    const widget = await loadRecaptchaV3({ siteKey: "6Le-v3-key" });
    await widget.getToken();

    expect(window.grecaptcha.execute).toHaveBeenCalledWith("6Le-v3-key", {
      action: "submit",
    });
  });
});
