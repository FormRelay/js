import type { BotProtection } from "../types";
import type { BotProtectionWidget } from "./types";

export type { BotProtectionWidget };

export function runTokenLoop(
  widget: BotProtectionWidget,
  onToken: (token: string) => void,
  onError?: (error: unknown) => void,
): { stop: () => void } {
  let stopped = false;
  let rejectAbort: ((error: Error) => void) | null = null;

  const abortPromise = new Promise<never>((_, reject) => {
    rejectAbort = reject;
  });

  async function loop() {
    while (!stopped) {
      try {
        const token = await Promise.race([widget.getToken(), abortPromise]);
        if (!stopped) {
          onToken(token);
        }
      } catch (error) {
        if (!stopped) {
          onError?.(error);
        }
        break;
      }
    }
  }

  loop().catch((error) => {
    if (!stopped) {
      onError?.(error);
    }
  });

  return {
    stop() {
      stopped = true;
      if (rejectAbort) {
        rejectAbort(new Error("Token loop stopped"));
        rejectAbort = null;
      }
      widget.remove();
    },
  };
}

export async function loadBotProtectionWidget(
  config: BotProtection,
  container: HTMLElement,
): Promise<BotProtectionWidget> {
  switch (config.type) {
    case "turnstile": {
      const { loadTurnstile } = await import("./turnstile");
      return loadTurnstile({ siteKey: config.siteKey, container });
    }
    case "recaptcha_v2": {
      const { loadRecaptchaV2 } = await import("./recaptcha-v2");
      return loadRecaptchaV2({ siteKey: config.siteKey, container });
    }
    case "recaptcha_v3": {
      const { loadRecaptchaV3 } = await import("./recaptcha-v3");
      return loadRecaptchaV3({ siteKey: config.siteKey });
    }
    default:
      throw new Error(`Unknown bot protection type: "${(config as BotProtection).type}"`);
  }
}
