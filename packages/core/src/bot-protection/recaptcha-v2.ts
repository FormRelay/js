import type { BotProtectionWidget } from "./types";
import { loadScript } from "./load-script";
import { createCallbackWidget } from "./create-widget";

export interface RecaptchaV2Options {
  siteKey: string;
  container: HTMLElement;
  theme?: "light" | "dark";
  size?: "compact" | "normal";
  tabindex?: number;
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

  return createCallbackWidget({
    render(callbacks) {
      const widgetId = window.grecaptcha.render(options.container, {
        sitekey: options.siteKey,
        callback: callbacks.onToken,
        "error-callback": () => callbacks.onError(new Error("reCAPTCHA challenge failed.")),
        "expired-callback": callbacks.onExpired,
        theme: options.theme,
        size: options.size,
        tabindex: options.tabindex,
      });

      return {
        reset: () => window.grecaptcha.reset(widgetId),
        remove: () => {
          while (options.container.firstChild) {
            options.container.removeChild(options.container.firstChild);
          }
        },
      };
    },
  });
}
