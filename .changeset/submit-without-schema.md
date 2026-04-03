---
"@formrelay/core": minor
"@formrelay/vue": minor
"@formrelay/nuxt": minor
---

Enable form submission without fetching a schema. `publicKey` is now optional on `createForm` — when omitted, `submit()` constructs the URL from `formId` and the API base URL.

New optional `botProtection` and `honeypotField` options on `createForm`, `useFormRelay`, and the `<FormRelay>` component allow SDK-managed bot protection and honeypot without a schema fetch.

Users who handle bot protection and honeypot entirely manually can omit these options and include the fields directly in form values.
