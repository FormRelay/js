import type { BotProtection } from "../types";
import type { BotProtectionWidget } from "./types";

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
