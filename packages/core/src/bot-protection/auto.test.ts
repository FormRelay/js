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

import { loadBotProtectionWidget, runTokenLoop } from "./auto";

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

describe("runTokenLoop", () => {
  test("calls onToken with initial token from getToken", async () => {
    const onToken = vi.fn();
    let resolveToken!: (token: string) => void;

    const widget = {
      getToken: vi.fn()
        .mockReturnValueOnce(new Promise<string>((r) => { resolveToken = r; }))
        .mockReturnValue(new Promise(() => {})),
      reset: vi.fn(),
      remove: vi.fn(),
    };

    runTokenLoop(widget, onToken);
    resolveToken("token-1");

    await vi.waitFor(() => expect(onToken).toHaveBeenCalledWith("token-1"));
  });

  test("calls onToken again when a subsequent getToken resolves", async () => {
    const onToken = vi.fn();
    let resolveFirst!: (token: string) => void;
    let resolveSecond!: (token: string) => void;

    const widget = {
      getToken: vi.fn()
        .mockReturnValueOnce(new Promise<string>((r) => { resolveFirst = r; }))
        .mockReturnValueOnce(new Promise<string>((r) => { resolveSecond = r; }))
        .mockReturnValue(new Promise(() => {})),
      reset: vi.fn(),
      remove: vi.fn(),
    };

    runTokenLoop(widget, onToken);

    resolveFirst("token-1");
    await vi.waitFor(() => expect(onToken).toHaveBeenCalledWith("token-1"));

    resolveSecond("token-2");
    await vi.waitFor(() => expect(onToken).toHaveBeenCalledWith("token-2"));
    expect(onToken).toHaveBeenCalledTimes(2);
  });

  test("stop breaks the loop and removes widget", async () => {
    const onToken = vi.fn();
    const widget = {
      getToken: vi.fn().mockReturnValue(new Promise(() => {})),
      reset: vi.fn(),
      remove: vi.fn(),
    };

    const handle = runTokenLoop(widget, onToken);
    handle.stop();

    await vi.waitFor(() => expect(widget.remove).toHaveBeenCalled());
    expect(onToken).not.toHaveBeenCalled();
  });

  test("does not call onToken after stop", async () => {
    const onToken = vi.fn();
    let resolveToken!: (token: string) => void;

    const widget = {
      getToken: vi.fn()
        .mockReturnValueOnce(new Promise<string>((r) => { resolveToken = r; }))
        .mockReturnValue(new Promise(() => {})),
      reset: vi.fn(),
      remove: vi.fn(),
    };

    const handle = runTokenLoop(widget, onToken);
    resolveToken("token-1");
    await vi.waitFor(() => expect(onToken).toHaveBeenCalledWith("token-1"));

    handle.stop();
    expect(onToken).toHaveBeenCalledTimes(1);
  });

  test("loop exits when getToken rejects", async () => {
    const onToken = vi.fn();
    const widget = {
      getToken: vi.fn().mockRejectedValue(new Error("widget error")),
      reset: vi.fn(),
      remove: vi.fn(),
    };

    runTokenLoop(widget, onToken);

    await vi.waitFor(() => expect(widget.getToken).toHaveBeenCalled());
    expect(onToken).not.toHaveBeenCalled();
  });
});
