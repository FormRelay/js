export const API_BASE_URL: string =
  (typeof process !== "undefined" && process.env?.FORMRELAY_API_URL) || "https://formrelay.app";
