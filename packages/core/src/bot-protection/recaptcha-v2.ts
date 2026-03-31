import type { BotProtectionWidget } from "./types";
import { loadScript } from "./load-script";

declare global {
  interface Window {
    grecaptcha: {
      render(
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
        },
      ): number;
      reset(widgetId: number): void;
      getResponse(widgetId: number): string;
    };
  }
}

export interface RecaptchaV2Options {
  siteKey: string;
  container: HTMLElement;
}

const RECAPTCHA_SCRIPT =
  "https://www.google.com/recaptcha/api.js?render=explicit";

export async function loadRecaptchaV2(
  options: RecaptchaV2Options,
): Promise<BotProtectionWidget> {
  await loadScript(RECAPTCHA_SCRIPT);

  let resolveToken: ((token: string) => void) | null = null;
  let currentToken: string | null = null;

  const widgetId = window.grecaptcha.render(options.container, {
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
      window.grecaptcha.reset(widgetId);
    },
    remove() {
      while (options.container.firstChild) {
        options.container.removeChild(options.container.firstChild);
      }
    },
  };
}
