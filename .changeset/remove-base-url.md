---
"@formrelay/core": patch
"@formrelay/vue": patch
"@formrelay/nuxt": patch
---

Remove `baseUrl` from public API. The FormRelay API URL is now hardcoded. Override via `FORMRELAY_API_URL` env var at build time for local development.

Nuxt module now supports both Nuxt 3 and Nuxt 4.
