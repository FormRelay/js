export type { BotProtectionWidget } from "./types";
import { loadScript } from "./load-script";
import { createCallbackWidget } from "./create-widget";

export interface TurnstileOptions {
  siteKey: string;
  container: HTMLElement;
  theme?: "light" | "dark" | "auto";
  appearance?: "always" | "execute" | "interaction-only";
  language?: string;
  size?: "normal" | "compact" | "flexible";
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

  return createCallbackWidget({
    render(callbacks) {
      const widgetId = window.turnstile.render(options.container, {
        sitekey: options.siteKey,
        callback: callbacks.onToken,
        "error-callback": () => callbacks.onError(new Error("Turnstile challenge failed.")),
        "expired-callback": callbacks.onExpired,
        theme: options.theme,
        appearance: options.appearance,
        language: options.language,
        size: options.size,
      });

      return {
        reset: () => window.turnstile.reset(widgetId),
        remove: () => window.turnstile.remove(widgetId),
      };
    },
  });
}
