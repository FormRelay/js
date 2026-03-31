import type { BotProtectionWidget } from "./types";
import { loadScript } from "./load-script";

export interface RecaptchaV3Options {
  siteKey: string;
  action?: string;
}

export async function loadRecaptchaV3(options: RecaptchaV3Options): Promise<BotProtectionWidget> {
  const scriptUrl = `https://www.google.com/recaptcha/api.js?render=${options.siteKey}`;
  await loadScript(scriptUrl);

  if (typeof window.grecaptcha === "undefined") {
    throw new Error(
      "reCAPTCHA failed to initialize after script load. " +
        "This may be caused by an ad blocker or content security policy.",
    );
  }

  await new Promise<void>((resolve) => {
    window.grecaptcha.ready(() => resolve());
  });

  const action = options.action ?? "submit";

  return {
    async getToken(): Promise<string> {
      return window.grecaptcha.execute(options.siteKey, { action });
    },
    reset() {
      // v3 is invisible — no widget to reset
    },
    remove() {
      // v3 is invisible — no widget to remove
    },
  };
}
