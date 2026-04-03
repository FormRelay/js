---
"@formrelay/vue": minor
"@formrelay/nuxt": minor
---

Add optional `#loading` and `#error` named slots to the `<FormRelay>` component. The `#loading` slot renders while the schema is being fetched, and the `#error` slot renders when the schema fetch fails (with `{ error }` as slot props). Both are fully backwards compatible — when omitted, the default slot receives `schemaLoading` and `schemaError` as before.
