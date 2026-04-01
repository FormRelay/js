---
"@formrelay/core": minor
"@formrelay/vue": minor
"@formrelay/nuxt": minor
---

Add automatic bot protection. Pass a `botProtectionContainer` ref to `useFormRelay` and the SDK handles widget loading, token acquisition, expiry renewal, reset re-initialization, and cleanup automatically.

New `@formrelay/core/bot-protection` entrypoint exports `loadBotProtectionWidget` and `runTokenLoop` for framework-agnostic widget lifecycle management.
