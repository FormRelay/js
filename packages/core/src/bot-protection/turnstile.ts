import type { BotProtectionWidget } from "./types";
import { loadScript } from "./load-script";

export interface TurnstileOptions {
  siteKey: string;
  container: HTMLElement;
}

const TURNSTILE_SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

export async function loadTurnstile(options: TurnstileOptions): Promise<BotProtectionWidget> {
  await loadScript(TURNSTILE_SCRIPT);

  if (typeof window.turnstile === "undefined") {
    throw new Error(
      "Turnstile failed to initialize after script load. " +
        "This may be caused by an ad blocker or content security policy.",
    );
  }

  let resolveToken: ((token: string) => void) | null = null;
  let rejectToken: ((error: Error) => void) | null = null;
  let currentToken: string | null = null;

  const widgetId = window.turnstile.render(options.container, {
    sitekey: options.siteKey,
    callback: (token: string) => {
      currentToken = token;
      if (resolveToken) {
        resolveToken(token);
        resolveToken = null;
        rejectToken = null;
      }
    },
    "error-callback": () => {
      currentToken = null;
      if (rejectToken) {
        rejectToken(new Error("Turnstile challenge failed."));
        resolveToken = null;
        rejectToken = null;
      }
    },
    "expired-callback": () => {
      currentToken = null;
    },
  });

  return {
    getToken(): Promise<string> {
      if (currentToken) return Promise.resolve(currentToken);
      return new Promise((resolve, reject) => {
        resolveToken = resolve;
        rejectToken = reject;
      });
    },
    reset() {
      currentToken = null;
      window.turnstile.reset(widgetId);
    },
    remove() {
      window.turnstile.remove(widgetId);
    },
  };
}
