# @formrelay/core

Framework-agnostic core client for [FormRelay](https://formrelay.app) — fetch form schemas, submit forms, validate data, and integrate bot protection.

## Install

```bash
npm install @formrelay/core
```

## Quick start

```ts
import { createForm } from "@formrelay/core";

const form = createForm("your-form-id", {
  publicKey: "pk_fr_...",
});

const schema = await form.getSchema();
const result = await form.submit({ email: "john@example.com" });

if (result.success) {
  console.log(result.message);
}
```

## Entrypoints

| Import | Description |
|--------|-------------|
| `@formrelay/core` | Main client — schema fetching, submission, error types |
| `@formrelay/core/validation` | Optional JSON Schema 2020-12 validation |
| `@formrelay/core/turnstile` | Cloudflare Turnstile widget loader |
| `@formrelay/core/recaptcha-v2` | Google reCAPTCHA v2 widget loader |
| `@formrelay/core/recaptcha-v3` | Google reCAPTCHA v3 widget loader |

All entrypoints are tree-shakeable — unused code is never bundled.

## Framework packages

For Vue, Nuxt, or React, use the framework-specific packages instead:

- [`@formrelay/vue`](https://www.npmjs.com/package/@formrelay/vue) — composable + renderless component
- [`@formrelay/nuxt`](https://www.npmjs.com/package/@formrelay/nuxt) — Nuxt module with auto-imports and SSR
- `@formrelay/react` — coming soon

## Documentation

[formrelay.app/docs](https://formrelay.app/docs)

## License

MIT
