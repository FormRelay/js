# @formrelay/nuxt

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
