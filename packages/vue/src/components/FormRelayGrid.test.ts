// @vitest-environment jsdom
import { describe, expect, test } from "vitest";
import { mount } from "@vue/test-utils";
import { h } from "vue";
import FormRelayGrid from "./FormRelayGrid";
import type { FormField } from "@formrelay/core";

const mockFields: FormField[] = [
  {
    name: "first_name",
    label: "First Name",
    type: "text",
    isRequired: true,
    htmlInputType: "text",
    options: null,
    helpText: null,
    order: 0,
    columnSpan: 1,
  },
  {
    name: "last_name",
    label: "Last Name",
    type: "text",
    isRequired: true,
    htmlInputType: "text",
    options: null,
    helpText: null,
    order: 1,
    columnSpan: 1,
  },
  {
    name: "email",
    label: "Email",
    type: "email",
    isRequired: true,
    htmlInputType: "email",
    options: null,
    helpText: null,
    order: 2,
    columnSpan: 2,
  },
];

describe("FormRelayGrid", () => {
  test("renders a grid container with correct columns", () => {
    const wrapper = mount(FormRelayGrid, {
      props: { fields: mockFields, columns: 2 },
      slots: {
        field: ({ field }: { field: FormField }) => h("input", { name: field.name }),
      },
    });

    const container = wrapper.element as HTMLElement;
    expect(container.style.display).toBe("grid");
    expect(container.style.gridTemplateColumns).toBe("repeat(2, 1fr)");
  });

  test("applies columnSpan to each field wrapper", () => {
    const wrapper = mount(FormRelayGrid, {
      props: { fields: mockFields, columns: 2 },
      slots: {
        field: ({ field }: { field: FormField }) => h("input", { name: field.name }),
      },
    });

    const children = wrapper.element.children;
    expect(children).toHaveLength(3);
    expect((children[0] as HTMLElement).style.gridColumn).toBe("span 1");
    expect((children[1] as HTMLElement).style.gridColumn).toBe("span 1");
    expect((children[2] as HTMLElement).style.gridColumn).toBe("span 2");
  });

  test("passes field to the slot", () => {
    const wrapper = mount(FormRelayGrid, {
      props: { fields: mockFields, columns: 2 },
      slots: {
        field: ({ field }: { field: FormField }) =>
          h("label", { "data-field": field.name }, field.label),
      },
    });

    const labels = wrapper.findAll("label");
    expect(labels).toHaveLength(3);
    expect(labels[0]!.attributes("data-field")).toBe("first_name");
    expect(labels[1]!.attributes("data-field")).toBe("last_name");
    expect(labels[2]!.attributes("data-field")).toBe("email");
  });

  test("renders nothing when no field slot is provided", () => {
    const wrapper = mount(FormRelayGrid, {
      props: { fields: mockFields, columns: 2 },
    });

    expect(wrapper.element.nodeType).toBe(Node.COMMENT_NODE);
  });

  test("uses custom tag when provided", () => {
    const wrapper = mount(FormRelayGrid, {
      props: { fields: mockFields, columns: 2, tag: "fieldset" },
      slots: {
        field: ({ field }: { field: FormField }) => h("input", { name: field.name }),
      },
    });

    expect(wrapper.element.tagName).toBe("FIELDSET");
  });

  test("adapts to different column counts", () => {
    const wrapper = mount(FormRelayGrid, {
      props: { fields: mockFields, columns: 3 },
      slots: {
        field: ({ field }: { field: FormField }) => h("input", { name: field.name }),
      },
    });

    expect((wrapper.element as HTMLElement).style.gridTemplateColumns).toBe("repeat(3, 1fr)");
  });
});
