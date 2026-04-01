import type { BotProtectionWidget } from "./types";

export interface TokenCallbacks {
  onToken: (token: string) => void;
  onError: (error: Error) => void;
  onExpired: () => void;
}

export interface WidgetHandle {
  reset(): void;
  remove(): void;
}

export function createCallbackWidget(config: {
  render: (callbacks: TokenCallbacks) => WidgetHandle;
}): BotProtectionWidget {
  let resolveToken: ((token: string) => void) | null = null;
  let rejectToken: ((error: Error) => void) | null = null;
  let currentToken: string | null = null;

  const handle = config.render({
    onToken(token) {
      currentToken = token;
      if (resolveToken) {
        resolveToken(token);
        resolveToken = null;
        rejectToken = null;
      }
    },
    onError(error) {
      currentToken = null;
      if (rejectToken) {
        rejectToken(error);
        resolveToken = null;
        rejectToken = null;
      }
    },
    onExpired() {
      currentToken = null;
    },
  });

  return {
    getToken() {
      if (currentToken) {
        const token = currentToken;
        currentToken = null;
        return Promise.resolve(token);
      }
      return new Promise((resolve, reject) => {
        resolveToken = resolve;
        rejectToken = reject;
      });
    },
    reset() {
      currentToken = null;
      handle.reset();
    },
    remove() {
      handle.remove();
    },
  };
}
