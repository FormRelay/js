/**
 * @vitest-environment jsdom
 */
import { describe, test, expect, vi, beforeEach } from "vitest";

const mockWidget = {
  getToken: vi.fn(),
  reset: vi.fn(),
  remove: vi.fn(),
};

vi.mock("./turnstile", () => ({
  loadTurnstile: vi.fn().mockResolvedValue(mockWidget),
}));

vi.mock("./recaptcha-v2", () => ({
  loadRecaptchaV2: vi.fn().mockResolvedValue(mockWidget),
}));

vi.mock("./recaptcha-v3", () => ({
  loadRecaptchaV3: vi.fn().mockResolvedValue(mockWidget),
}));

import { loadBotProtectionWidget } from "./auto";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("loadBotProtectionWidget", () => {
  test("loads turnstile with siteKey and container", async () => {
    const container = document.createElement("div");
    await loadBotProtectionWidget({ type: "turnstile", siteKey: "0x-key" }, container);

    const { loadTurnstile } = await import("./turnstile");
    expect(loadTurnstile).toHaveBeenCalledWith({ siteKey: "0x-key", container });
  });

  test("loads recaptcha v2 with siteKey and container", async () => {
    const container = document.createElement("div");
    await loadBotProtectionWidget({ type: "recaptcha_v2", siteKey: "rc-key" }, container);

    const { loadRecaptchaV2 } = await import("./recaptcha-v2");
    expect(loadRecaptchaV2).toHaveBeenCalledWith({ siteKey: "rc-key", container });
  });

  test("loads recaptcha v3 with siteKey only (no container)", async () => {
    const container = document.createElement("div");
    await loadBotProtectionWidget({ type: "recaptcha_v3", siteKey: "rc3-key" }, container);

    const { loadRecaptchaV3 } = await import("./recaptcha-v3");
    expect(loadRecaptchaV3).toHaveBeenCalledWith({ siteKey: "rc3-key" });
  });

  test("returns the widget from the loader", async () => {
    const container = document.createElement("div");
    const widget = await loadBotProtectionWidget({ type: "turnstile", siteKey: "0x-key" }, container);

    expect(widget).toBe(mockWidget);
  });

  test("throws on unknown protection type", async () => {
    const container = document.createElement("div");
    await expect(
      loadBotProtectionWidget({ type: "unknown" as any, siteKey: "key" }, container),
    ).rejects.toThrow('Unknown bot protection type: "unknown"');
  });
});
