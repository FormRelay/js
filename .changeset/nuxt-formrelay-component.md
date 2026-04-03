---
"@formrelay/vue": minor
"@formrelay/nuxt": minor
---

Make `publicKey` optional on the `<FormRelay>` component and `useFormRelay` composable. When omitted, the schema fetch is skipped and the form renders immediately with empty state for manual form building.

Add `initialSchema` and `botProtectionContainer` as optional props on the Vue `<FormRelay>` component, matching features already available on the composable. All props now use `PropType` for proper template-level type safety.

Extract shared `renderFormRelay()` helper for consistent slot rendering across packages.

The Nuxt `<FormRelay>` component is now an async component wrapping the Nuxt `useFormRelay` composable, providing SSR schema prefetch, automatic `publicKey` injection from runtime config, and secret key support. Only `formId` is required. The Nuxt composable now correctly skips the schema fetch when no `publicKey` is configured.
