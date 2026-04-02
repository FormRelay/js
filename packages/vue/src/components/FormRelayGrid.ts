import { defineComponent, h, type PropType } from "vue";
import type { FormField } from "@formrelay/core";

export default defineComponent({
  name: "FormRelayGrid",
  props: {
    columns: {
      type: Number,
      default: 2,
      validator: (v: number) => Number.isInteger(v) && v >= 1,
    },
    fields: { type: Array as PropType<FormField[]>, required: true },
    tag: { type: String, default: "div" },
  },
  setup(props, { slots }) {
    return () => {
      if (!slots.field) return null;

      const children = props.fields.map((field) => {
        const span = Math.min(Math.max(1, field.columnSpan), props.columns);

        return h(
          "div",
          {
            key: field.name,
            style: { gridColumn: `span ${span}` },
          },
          slots.field!({ field }),
        );
      });

      return h(
        props.tag,
        {
          style: {
            display: "grid",
            gridTemplateColumns: `repeat(${props.columns}, 1fr)`,
          },
        },
        children,
      );
    };
  },
});
