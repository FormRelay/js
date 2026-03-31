export interface BotProtectionWidget {
  getToken(): Promise<string>;
  reset(): void;
  remove(): void;
}
