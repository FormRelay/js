---
"@formrelay/core": patch
"@formrelay/vue": patch
"@formrelay/nuxt": patch
---

Add column span support for form field layout. The form schema now exposes `columns` (number of grid columns) and each field has a `columnSpan` property controlling its width.

New `<FormRelayGrid>` component in `@formrelay/vue` and `@formrelay/nuxt` handles CSS grid layout automatically — consumers just define their field template via the `#field` scoped slot.
