// @vitest-environment jsdom
import { describe, expect, test, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { h, nextTick } from "vue";
import FormRelay from "./FormRelay";

const mockSchema = {
  id: "01abc",
  name: "Test Form",
  isActive: true,
  columns: 2,
  fields: [
    {
      name: "email",
      label: "Email",
      type: "email",
      isRequired: true,
      htmlInputType: "email",
      options: null,
      helpText: null,
      order: 0,
      columnSpan: 2,
    },
  ],
  validationSchema: { type: "object" },
  honeypotField: null,
  botProtection: null,
  submitUrl: "https://formrelay.app/api/v1/form/01abc",
};

vi.mock("@formrelay/core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@formrelay/core")>();
  return {
    ...actual,
    createForm: vi.fn(() => ({
      getSchema: vi.fn().mockResolvedValue(mockSchema),
      submit: vi.fn().mockResolvedValue({ success: true, message: "OK" }),
    })),
  };
});

describe("FormRelay", () => {
  test("exposes composable state as slot props", async () => {
    let slotProps: any;

    mount(FormRelay, {
      props: { formId: "01abc", publicKey: "pk_fr_test" },
      slots: {
        default: (props: any) => {
          slotProps = props;
          return h("div");
        },
      },
    });

    await flushPromises();
    await nextTick();

    expect(slotProps).toBeDefined();
    expect(slotProps.columns).toBe(2);
    expect(slotProps.fields).toBeDefined();
    expect(slotProps.values).toBeDefined();
    expect(slotProps.errors).toBeDefined();
    expect(slotProps.submit).toBeTypeOf("function");
    expect(slotProps.reset).toBeTypeOf("function");
    expect(slotProps.setBotToken).toBeTypeOf("function");
    expect(slotProps.submitting).toBeDefined();
    expect(slotProps.submitted).toBeDefined();
    expect(slotProps.botProtection).toBeDefined();
    expect(slotProps.validationSchema).toBeDefined();
    expect(slotProps.schemaLoading).toBeDefined();
  });

  test("passes props to composable", async () => {
    const { createForm } = await import("@formrelay/core");

    mount(FormRelay, {
      props: {
        formId: "form-123",
        publicKey: "pk_fr_abc",
      },
      slots: { default: () => h("div") },
    });

    expect(createForm).toHaveBeenCalledWith("form-123", {
      publicKey: "pk_fr_abc",
    });
  });

  test("renders slot content", async () => {
    const wrapper = mount(FormRelay, {
      props: { formId: "01abc", publicKey: "pk_fr_test" },
      slots: {
        default: () => h("div", { id: "test-content" }, "hello"),
      },
    });

    await flushPromises();

    expect(wrapper.find("#test-content").exists()).toBe(true);
    expect(wrapper.find("#test-content").text()).toBe("hello");
  });
});
