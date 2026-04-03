---
"@formrelay/vue": minor
---

Make `publicKey` optional on the `<FormRelay>` component and `useFormRelay` composable. When omitted, the schema fetch is skipped and the form renders immediately with empty state for manual form building.

Add `initialSchema` and `botProtectionContainer` as optional props on the `<FormRelay>` component, matching features already available on the composable.

The Nuxt `<FormRelay>` component is now an async component wrapping the Nuxt `useFormRelay` composable, providing SSR schema prefetch, automatic `publicKey` injection from runtime config, and secret key support. Only `formId` is required.
