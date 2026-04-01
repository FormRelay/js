# @formrelay/nuxt

Nuxt module for [FormRelay](https://formrelay.app) — auto-imported composable and component with SSR schema fetching.

## Install

```bash
npm install @formrelay/nuxt
```

## Setup

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ["@formrelay/nuxt"],
  formrelay: {
    publicKey: "pk_fr_...",
  },
});
```

## Usage

`useFormRelay` and `<FormRelay>` are auto-imported — no import statements needed.

```vue
<script setup>
const { fields, values, errors, submit, submitted, canSubmit } =
  await useFormRelay({ formId: "your-form-id" });
</script>

<template>
  <div v-if="submitted">Thanks!</div>

  <form v-else @submit.prevent="submit">
    <div v-for="field in fields" :key="field.name">
      <label>{{ field.label }}</label>
      <input :type="field.htmlInputType" v-model="values[field.name]" />
      <span v-if="errors[field.name]">{{ errors[field.name][0] }}</span>
    </div>
    <button type="submit" :disabled="!canSubmit">Send</button>
  </form>
</template>
```

The schema is fetched server-side during SSR and hydrated to the client — no loading flash.

## Documentation

[formrelay.app/docs/integration-nuxt-sdk](https://formrelay.app/docs/integration-nuxt-sdk)

## License

MIT
