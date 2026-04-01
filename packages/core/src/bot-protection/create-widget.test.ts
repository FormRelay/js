import { describe, expect, test, vi } from "vitest";
import { createCallbackWidget, type TokenCallbacks } from "./create-widget";

function createWidget() {
  let callbacks: TokenCallbacks;

  const resetFn = vi.fn();
  const removeFn = vi.fn();

  const widget = createCallbackWidget({
    render(cb) {
      callbacks = cb;
      return { reset: resetFn, remove: removeFn };
    },
  });

  return { widget, callbacks: callbacks!, resetFn, removeFn };
}

describe("createCallbackWidget", () => {
  test("getToken resolves when onToken fires", async () => {
    const { widget, callbacks } = createWidget();

    const promise = widget.getToken();
    callbacks.onToken("token-123");

    expect(await promise).toBe("token-123");
  });

  test("getToken resolves immediately if token already received", async () => {
    const { widget, callbacks } = createWidget();

    callbacks.onToken("cached-token");

    expect(await widget.getToken()).toBe("cached-token");
  });

  test("getToken rejects when onError fires", async () => {
    const { widget, callbacks } = createWidget();

    const promise = widget.getToken();
    callbacks.onError(new Error("challenge failed"));

    await expect(promise).rejects.toThrow("challenge failed");
  });

  test("onExpired clears cached token", async () => {
    const { widget, callbacks } = createWidget();

    callbacks.onToken("old-token");
    callbacks.onExpired();

    // getToken should now wait for a new token instead of returning the expired one
    const promise = widget.getToken();
    callbacks.onToken("new-token");

    expect(await promise).toBe("new-token");
  });

  test("reset clears token and delegates to handle", () => {
    const { widget, callbacks, resetFn } = createWidget();

    callbacks.onToken("token");
    widget.reset();

    expect(resetFn).toHaveBeenCalled();
  });

  test("remove delegates to handle", () => {
    const { widget, removeFn } = createWidget();

    widget.remove();

    expect(removeFn).toHaveBeenCalled();
  });

  test("onError without pending getToken does not throw", () => {
    const { callbacks } = createWidget();

    // Should not throw when no one is waiting
    expect(() => callbacks.onError(new Error("no listener"))).not.toThrow();
  });

  test("getToken consumes cached token so next call waits", async () => {
    const { widget, callbacks } = createWidget();

    callbacks.onToken("first-token");

    // First call returns and consumes
    expect(await widget.getToken()).toBe("first-token");

    // Second call waits for a new token
    const promise = widget.getToken();
    callbacks.onToken("second-token");

    expect(await promise).toBe("second-token");
  });
});
