import type { BotProtectionWidget } from "./types";
import { loadScript } from "./load-script";

export interface RecaptchaV2Options {
  siteKey: string;
  container: HTMLElement;
}

const RECAPTCHA_SCRIPT = "https://www.google.com/recaptcha/api.js?render=explicit";

export async function loadRecaptchaV2(options: RecaptchaV2Options): Promise<BotProtectionWidget> {
  await loadScript(RECAPTCHA_SCRIPT);

  if (typeof window.grecaptcha === "undefined") {
    throw new Error(
      "reCAPTCHA failed to initialize after script load. " +
        "This may be caused by an ad blocker or content security policy.",
    );
  }

  let resolveToken: ((token: string) => void) | null = null;
  let rejectToken: ((error: Error) => void) | null = null;
  let currentToken: string | null = null;

  const widgetId = window.grecaptcha.render(options.container, {
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
        rejectToken(new Error("reCAPTCHA challenge failed."));
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
      window.grecaptcha.reset(widgetId);
    },
    remove() {
      while (options.container.firstChild) {
        options.container.removeChild(options.container.firstChild);
      }
    },
  };
}
