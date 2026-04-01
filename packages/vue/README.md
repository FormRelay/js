# @formrelay/vue

Vue 3 composable and renderless component for [FormRelay](https://formrelay.app).

## Install

```bash
npm install @formrelay/vue @formrelay/core
```

## Quick start

```vue
<script setup>
import { useFormRelay } from "@formrelay/vue";

const { fields, values, errors, submit, submitting, submitted, canSubmit } =
  useFormRelay({
    formId: "your-form-id",
    publicKey: "pk_fr_...",
  });
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

## Renderless component

```vue
<template>
  <FormRelay
    form-id="your-form-id"
    public-key="pk_fr_..."
    v-slot="{ fields, values, errors, submit, canSubmit }"
  >
    <!-- Your markup here -->
  </FormRelay>
</template>
```

## Using with Nuxt?

Use [`@formrelay/nuxt`](https://www.npmjs.com/package/@formrelay/nuxt) instead for auto-imports and SSR support.

## Documentation

[formrelay.app/docs/integration-vue-sdk](https://formrelay.app/docs/integration-vue-sdk)

## License

MIT
