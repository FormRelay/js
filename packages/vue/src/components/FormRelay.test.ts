// @vitest-environment jsdom
import { describe, expect, test, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { h, nextTick, ref } from "vue";
import FormRelay from "./FormRelay";
import { FormRelayError } from "@formrelay/core";

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

  test("renders loading slot while schema is loading", () => {
    const wrapper = mount(FormRelay, {
      props: { formId: "01abc", publicKey: "pk_fr_test" },
      slots: {
        loading: () => h("div", { id: "loading" }, "Loading..."),
        default: () => h("div", { id: "form" }, "form content"),
      },
    });

    expect(wrapper.find("#loading").exists()).toBe(true);
    expect(wrapper.find("#form").exists()).toBe(false);
  });

  test("renders default slot after schema loads when loading slot is provided", async () => {
    const wrapper = mount(FormRelay, {
      props: { formId: "01abc", publicKey: "pk_fr_test" },
      slots: {
        loading: () => h("div", { id: "loading" }, "Loading..."),
        default: () => h("div", { id: "form" }, "form content"),
      },
    });

    await flushPromises();
    await nextTick();

    expect(wrapper.find("#loading").exists()).toBe(false);
    expect(wrapper.find("#form").exists()).toBe(true);
  });

  test("renders default slot during loading when no loading slot is provided", () => {
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

    expect(slotProps).toBeDefined();
    expect(slotProps.schemaLoading).toBe(true);
  });

  test("renders error slot when schema fetch fails", async () => {
    const { createForm } = await import("@formrelay/core");
    vi.mocked(createForm).mockReturnValueOnce({
      getSchema: vi.fn().mockRejectedValue(new Error("Network error")),
      submit: vi.fn(),
    } as any);

    const wrapper = mount(FormRelay, {
      props: { formId: "01abc", publicKey: "pk_fr_test" },
      slots: {
        error: (props: any) => h("div", { id: "error" }, props.error.detail),
        default: () => h("div", { id: "form" }, "form content"),
      },
    });

    await flushPromises();
    await nextTick();

    expect(wrapper.find("#error").exists()).toBe(true);
    expect(wrapper.find("#error").text()).toBe("Network error");
    expect(wrapper.find("#form").exists()).toBe(false);
  });

  test("renders default slot with schemaError when no error slot is provided", async () => {
    const { createForm } = await import("@formrelay/core");
    vi.mocked(createForm).mockReturnValueOnce({
      getSchema: vi.fn().mockRejectedValue(new Error("Network error")),
      submit: vi.fn(),
    } as any);

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

    expect(slotProps.schemaError).toBeDefined();
    expect(slotProps.schemaError.detail).toBe("Network error");
  });

  test("transitions from loading slot to error slot when fetch fails", async () => {
    const { createForm } = await import("@formrelay/core");
    vi.mocked(createForm).mockReturnValueOnce({
      getSchema: vi.fn().mockRejectedValue(new Error("Network error")),
      submit: vi.fn(),
    } as any);

    const wrapper = mount(FormRelay, {
      props: { formId: "01abc", publicKey: "pk_fr_test" },
      slots: {
        loading: () => h("div", { id: "loading" }, "Loading..."),
        error: (props: any) => h("div", { id: "error" }, props.error.detail),
        default: () => h("div", { id: "form" }, "form content"),
      },
    });

    expect(wrapper.find("#loading").exists()).toBe(true);
    expect(wrapper.find("#error").exists()).toBe(false);

    await flushPromises();
    await nextTick();

    expect(wrapper.find("#loading").exists()).toBe(false);
    expect(wrapper.find("#error").exists()).toBe(true);
    expect(wrapper.find("#error").text()).toBe("Network error");
    expect(wrapper.find("#form").exists()).toBe(false);
  });

  test("renders error slot with FormRelayError passed through directly", async () => {
    const schemaError = new FormRelayError({
      type: "https://formrelay.app/errors#not-found",
      title: "Not Found",
      status: 404,
      detail: "Form not found",
    });

    const { createForm } = await import("@formrelay/core");
    vi.mocked(createForm).mockReturnValueOnce({
      getSchema: vi.fn().mockRejectedValue(schemaError),
      submit: vi.fn(),
    } as any);

    let errorProps: any;

    const wrapper = mount(FormRelay, {
      props: { formId: "01abc", publicKey: "pk_fr_test" },
      slots: {
        error: (props: any) => {
          errorProps = props;
          return h("div", { id: "error" }, props.error.detail);
        },
        default: () => h("div", { id: "form" }),
      },
    });

    await flushPromises();
    await nextTick();

    expect(wrapper.find("#error").exists()).toBe(true);
    expect(errorProps.error).toBe(schemaError);
    expect(errorProps.error.status).toBe(404);
    expect(errorProps.error.title).toBe("Not Found");
  });

  test("renders nothing when no slots are provided", async () => {
    const wrapper = mount(FormRelay, {
      props: { formId: "01abc", publicKey: "pk_fr_test" },
    });

    await flushPromises();
    await nextTick();

    expect(wrapper.html()).toBe("");
  });

  test("uses initialSchema prop and skips fetch", async () => {
    const { createForm } = await import("@formrelay/core");
    const mockGetSchema = vi.fn();
    vi.mocked(createForm).mockReturnValueOnce({
      getSchema: mockGetSchema,
      submit: vi.fn().mockResolvedValue({ success: true, message: "OK" }),
    } as any);

    let slotProps: any;

    mount(FormRelay, {
      props: { formId: "01abc", publicKey: "pk_fr_test", initialSchema: mockSchema },
      slots: {
        default: (props: any) => {
          slotProps = props;
          return h("div");
        },
      },
    });

    await flushPromises();
    await nextTick();

    expect(mockGetSchema).not.toHaveBeenCalled();
    expect(slotProps.schemaLoading).toBe(false);
    expect(slotProps.fields).toHaveLength(1);
  });

  test("forwards botProtectionContainer as reactive ref to composable", async () => {
    const containerRef = ref<HTMLElement | null>(null);

    const mockSchemaWithBot = {
      ...mockSchema,
      botProtection: { type: "turnstile" as const, siteKey: "0x-key" },
    };

    const { createForm } = await import("@formrelay/core");
    vi.mocked(createForm).mockReturnValueOnce({
      getSchema: vi.fn().mockResolvedValue(mockSchemaWithBot),
      submit: vi.fn().mockResolvedValue({ success: true, message: "OK" }),
    } as any);

    let slotProps: any;

    mount(FormRelay, {
      props: {
        formId: "01abc",
        publicKey: "pk_fr_test",
        botProtectionContainer: containerRef,
      },
      slots: {
        default: (props: any) => {
          slotProps = props;
          return h("div");
        },
      },
    });

    await flushPromises();
    await nextTick();

    expect(slotProps.botProtection).toEqual({ type: "turnstile", siteKey: "0x-key" });
  });

  test("renders default slot immediately when publicKey is omitted", () => {
    let slotProps: any;

    mount(FormRelay, {
      props: { formId: "01abc" },
      slots: {
        default: (props: any) => {
          slotProps = props;
          return h("div");
        },
      },
    });

    expect(slotProps).toBeDefined();
    expect(slotProps.schemaLoading).toBe(false);
    expect(slotProps.fields).toEqual([]);
  });
});
