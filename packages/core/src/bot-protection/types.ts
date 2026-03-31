export interface BotProtectionWidget {
  getToken(): Promise<string>;
  reset(): void;
  remove(): void;
}

declare global {
  interface Window {
    turnstile: {
      render(
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "error-callback"?: () => void;
          "expired-callback"?: () => void;
        },
      ): string;
      reset(widgetId: string): void;
      remove(widgetId: string): void;
    };
    grecaptcha: {
      render(
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "error-callback"?: () => void;
          "expired-callback"?: () => void;
        },
      ): number;
      reset(widgetId: number): void;
      getResponse(widgetId: number): string;
      ready(callback: () => void): void;
      execute(siteKey: string, options: { action: string }): Promise<string>;
    };
  }
}
