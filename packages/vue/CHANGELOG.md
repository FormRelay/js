# @formrelay/vue

## 0.2.0

### Minor Changes

- 22b536c: Add automatic bot protection. Pass a `botProtectionContainer` ref to `useFormRelay` and the SDK handles widget loading, token acquisition, expiry renewal, reset re-initialization, and cleanup automatically.

  New `@formrelay/core/bot-protection` entrypoint exports `loadBotProtectionWidget` and `runTokenLoop` for framework-agnostic widget lifecycle management.

### Patch Changes

- Updated dependencies [22b536c]
  - @formrelay/core@0.2.0

## 0.1.1

### Patch Changes

- 1da5dd1: Remove `baseUrl` from public API. The FormRelay API URL is now hardcoded. Override via `FORMRELAY_API_URL` env var at build time for local development.

  Nuxt module now supports both Nuxt 3 and Nuxt 4.

- Updated dependencies [1da5dd1]
  - @formrelay/core@0.1.1

## 1.0.0

### Minor Changes

- Initial release of the FormRelay JS SDK.
  - `@formrelay/core`: Schema fetching, form submission, validation, bot protection widget loaders
  - `@formrelay/vue`: `useFormRelay` composable and `<FormRelay>` renderless component
  - `@formrelay/nuxt`: Nuxt module with auto-imports, runtime config, SSR schema fetch

### Patch Changes

- Updated dependencies
  - @formrelay/core@1.0.0
