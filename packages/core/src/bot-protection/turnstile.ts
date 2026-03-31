import type { BotProtectionWidget } from "./types";
import { loadScript } from "./load-script";

declare global {
  interface Window {
    turnstile: {
      render(
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
        },
      ): string;
      reset(widgetId: string): void;
      remove(widgetId: string): void;
    };
  }
}

export interface TurnstileOptions {
  siteKey: string;
  container: HTMLElement;
}

const TURNSTILE_SCRIPT =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

export async function loadTurnstile(
  options: TurnstileOptions,
): Promise<BotProtectionWidget> {
  await loadScript(TURNSTILE_SCRIPT);

  let resolveToken: ((token: string) => void) | null = null;
  let currentToken: string | null = null;

  const widgetId = window.turnstile.render(options.container, {
    sitekey: options.siteKey,
    callback: (token: string) => {
      currentToken = token;
      if (resolveToken) {
        resolveToken(token);
        resolveToken = null;
      }
    },
  });

  return {
    getToken(): Promise<string> {
      if (currentToken) return Promise.resolve(currentToken);
      return new Promise((resolve) => {
        resolveToken = resolve;
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
