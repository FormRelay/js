# @formrelay/nuxt

## 0.3.0

### Minor Changes

- 3886dc7: Make `publicKey` optional on the `<FormRelay>` component and `useFormRelay` composable. When omitted, the schema fetch is skipped and the form renders immediately with empty state for manual form building.

  Add `initialSchema` and `botProtectionContainer` as optional props on the Vue `<FormRelay>` component, matching features already available on the composable. All props now use `PropType` for proper template-level type safety.

  Extract shared `renderFormRelay()` helper for consistent slot rendering across packages.

  The Nuxt `<FormRelay>` component is now an async component wrapping the Nuxt `useFormRelay` composable, providing SSR schema prefetch, automatic `publicKey` injection from runtime config, and secret key support. Only `formId` is required. The Nuxt composable now correctly skips the schema fetch when no `publicKey` is configured.

- 705d5b8: Enable form submission without fetching a schema. `publicKey` is now optional on `createForm` — when omitted, `submit()` constructs the URL from `formId` and the API base URL.

  New optional `botProtection` and `honeypotField` options on `createForm`, `useFormRelay`, and the `<FormRelay>` component allow SDK-managed bot protection and honeypot without a schema fetch.

  Users who handle bot protection and honeypot entirely manually can omit these options and include the fields directly in form values.

### Patch Changes

- Updated dependencies [08e8080]
- Updated dependencies [3886dc7]
- Updated dependencies [705d5b8]
  - @formrelay/vue@0.3.0
  - @formrelay/core@0.3.0

## 0.2.1

### Patch Changes

- dffd20b: Add column span support for form field layout. The form schema now exposes `columns` (number of grid columns) and each field has a `columnSpan` property controlling its width.

  New `<FormRelayGrid>` component in `@formrelay/vue` and `@formrelay/nuxt` handles CSS grid layout automatically — consumers just define their field template via the `#field` scoped slot.

- Updated dependencies [dffd20b]
  - @formrelay/core@0.2.1
  - @formrelay/vue@0.2.1

## 0.2.0

### Minor Changes

- 22b536c: Add automatic bot protection. Pass a `botProtectionContainer` ref to `useFormRelay` and the SDK handles widget loading, token acquisition, expiry renewal, reset re-initialization, and cleanup automatically.

  New `@formrelay/core/bot-protection` entrypoint exports `loadBotProtectionWidget` and `runTokenLoop` for framework-agnostic widget lifecycle management.

### Patch Changes

- Updated dependencies [22b536c]
  - @formrelay/core@0.2.0
  - @formrelay/vue@0.2.0

## 0.1.1

### Patch Changes

- 1da5dd1: Remove `baseUrl` from public API. The FormRelay API URL is now hardcoded. Override via `FORMRELAY_API_URL` env var at build time for local development.

  Nuxt module now supports both Nuxt 3 and Nuxt 4.

- Updated dependencies [1da5dd1]
  - @formrelay/core@0.1.1
  - @formrelay/vue@0.1.1

## 1.0.0

### Minor Changes

- Initial release of the FormRelay JS SDK.
  - `@formrelay/core`: Schema fetching, form submission, validation, bot protection widget loaders
  - `@formrelay/vue`: `useFormRelay` composable and `<FormRelay>` renderless component
  - `@formrelay/nuxt`: Nuxt module with auto-imports, runtime config, SSR schema fetch

### Patch Changes

- Updated dependencies
  - @formrelay/core@1.0.0
  - @formrelay/vue@1.0.0
