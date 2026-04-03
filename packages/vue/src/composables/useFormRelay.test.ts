import { describe, expect, test, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { nextTick, isRef, isReactive, defineComponent, ref } from "vue";
import { ValidationError } from "@formrelay/core";
import { useFormRelay } from "./useFormRelay";

const mockFields = [
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
  {
    name: "name",
    label: "Name",
    type: "text",
    isRequired: false,
    htmlInputType: "text",
    options: null,
    helpText: null,
    order: 1,
    columnSpan: 1,
  },
];

const mockSchema = {
  id: "01abc",
  name: "Test Form",
  isActive: true,
  columns: 2,
  fields: mockFields,
  validationSchema: { type: "object" },
  honeypotField: "_hp_phone",
  botProtection: null,
  submitUrl: "https://formrelay.app/api/v1/form/01abc",
};

const mockSchemaWithBot = {
  ...mockSchema,
  botProtection: { type: "turnstile" as const, siteKey: "0x-key" },
};

const mockGetSchema = vi.fn().mockResolvedValue(mockSchema);
const mockSubmit = vi.fn().mockResolvedValue({
  success: true,
  message: "Form submitted successfully.",
});

vi.mock("@formrelay/core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@formrelay/core")>();
  return {
    ...actual,
    createForm: vi.fn(() => ({
      getSchema: mockGetSchema,
      submit: mockSubmit,
    })),
  };
});

const mockBotWidget = {
  getToken: vi.fn(),
  reset: vi.fn(),
  remove: vi.fn(),
};

const mockTokenLoopHandle = {
  stop: vi.fn(),
};

vi.mock("@formrelay/core/bot-protection", () => ({
  loadBotProtectionWidget: vi.fn().mockResolvedValue(mockBotWidget),
  runTokenLoop: vi.fn().mockReturnValue(mockTokenLoopHandle),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockGetSchema.mockResolvedValue(mockSchema);
  mockSubmit.mockResolvedValue({
    success: true,
    message: "Form submitted successfully.",
  });
  mockBotWidget.getToken.mockReset();
  mockBotWidget.reset.mockReset();
  mockBotWidget.remove.mockReset();
  mockTokenLoopHandle.stop.mockReset();
});

function mountComposable(options: Parameters<typeof useFormRelay>[0]) {
  let result!: ReturnType<typeof useFormRelay>;
  const wrapper = mount(
    defineComponent({
      setup() {
        result = useFormRelay(options);
        return () => null;
      },
    }),
  );
  return { result, wrapper };
}

describe("useFormRelay", () => {
  test("returns reactive refs and computed values", () => {
    const result = useFormRelay({
      formId: "01abc",
      publicKey: "pk_fr_test",
    });

    expect(isRef(result.schema)).toBe(true);
    expect(isRef(result.schemaLoading)).toBe(true);
    expect(isRef(result.schemaError)).toBe(true);
    expect(isReactive(result.values)).toBe(true);
    expect(isRef(result.errors)).toBe(true);
    expect(isRef(result.submitting)).toBe(true);
    expect(isRef(result.submitted)).toBe(true);
  });

  test("fetches schema on init and populates state", async () => {
    mockGetSchema.mockResolvedValueOnce(mockSchemaWithBot);

    const { schema, columns, fields, schemaLoading, botProtection, validationSchema } =
      useFormRelay({
        formId: "01abc",
        publicKey: "pk_fr_test",
      });

    expect(schemaLoading.value).toBe(true);

    await nextTick();
    await nextTick();

    expect(schemaLoading.value).toBe(false);
    expect(schema.value).toEqual(mockSchemaWithBot);
    expect(columns.value).toBe(2);
    expect(fields.value).toHaveLength(2);
    expect(botProtection.value).toEqual({
      type: "turnstile",
      siteKey: "0x-key",
    });
    expect(validationSchema.value).toEqual({ type: "object" });
  });

  test("initializes field values as empty strings after schema load", async () => {
    const { values } = useFormRelay({
      formId: "01abc",
      publicKey: "pk_fr_test",
    });

    await nextTick();
    await nextTick();

    expect(values.email).toBe("");
    expect(values.name).toBe("");
  });

  test("uses initialSchema and skips fetch when provided", () => {
    const { schema, schemaLoading, fields, values } = useFormRelay({
      formId: "01abc",
      publicKey: "pk_fr_test",
      initialSchema: mockSchemaWithBot,
    });

    expect(mockGetSchema).not.toHaveBeenCalled();
    expect(schemaLoading.value).toBe(false);
    expect(schema.value).toEqual(mockSchemaWithBot);
    expect(fields.value).toHaveLength(2);
    expect(values.email).toBe("");
    expect(values.name).toBe("");
  });

  test("sets schemaError on fetch failure", async () => {
    const error = new Error("fetch failed");
    mockGetSchema.mockRejectedValueOnce(error);

    const { schemaError, schemaLoading } = useFormRelay({
      formId: "01abc",
      publicKey: "pk_fr_test",
    });

    await nextTick();
    await nextTick();

    expect(schemaLoading.value).toBe(false);
    expect(schemaError.value).toBeInstanceOf(Error);
    expect(schemaError.value?.detail).toBe("fetch failed");
  });

  test("submit sends values to core", async () => {
    const { values, submit, submitted } = useFormRelay({
      formId: "01abc",
      publicKey: "pk_fr_test",
      initialSchema: mockSchema,
    });

    values.email = "john@example.com";
    await submit();

    expect(mockSubmit).toHaveBeenCalledWith({ email: "john@example.com", name: "" }, {});
    expect(submitted.value).toBe(true);
  });

  test("submit includes bot token when set", async () => {
    const { values, submit, setBotToken } = useFormRelay({
      formId: "01abc",
      publicKey: "pk_fr_test",
      initialSchema: mockSchemaWithBot,
    });

    values.email = "john@example.com";
    setBotToken("turnstile-token-123");
    await submit();

    expect(mockSubmit).toHaveBeenCalledWith(
      { email: "john@example.com", name: "" },
      { botToken: "turnstile-token-123" },
    );
  });

  test("submit runs validate callback and blocks on errors", async () => {
    const validate = vi.fn().mockReturnValue({
      email: ["Email is required"],
    });

    const { submit, errors } = useFormRelay({
      formId: "01abc",
      publicKey: "pk_fr_test",
      initialSchema: mockSchema,
      validate,
    });

    await submit();

    expect(validate).toHaveBeenCalled();
    expect(mockSubmit).not.toHaveBeenCalled();
    expect(errors.value).toEqual({ email: ["Email is required"] });
  });

  test("submit proceeds when validate returns empty object", async () => {
    const validate = vi.fn().mockReturnValue({});

    const { submit } = useFormRelay({
      formId: "01abc",
      publicKey: "pk_fr_test",
      initialSchema: mockSchema,
      validate,
    });

    await submit();

    expect(mockSubmit).toHaveBeenCalled();
  });

  test("submit calls onSuccess callback", async () => {
    const onSuccess = vi.fn();

    const { submit } = useFormRelay({
      formId: "01abc",
      publicKey: "pk_fr_test",
      initialSchema: mockSchema,
      onSuccess,
    });

    await submit();

    expect(onSuccess).toHaveBeenCalledWith({
      message: "Form submitted successfully.",
    });
  });

  test("submit calls onError callback on failure", async () => {
    const error = { type: "", title: "Error", status: 500, detail: "fail" };
    mockSubmit.mockResolvedValueOnce({ success: false, error });

    const onError = vi.fn();

    const { submit } = useFormRelay({
      formId: "01abc",
      publicKey: "pk_fr_test",
      initialSchema: mockSchema,
      onError,
    });

    await submit();

    expect(onError).toHaveBeenCalledWith(error);
  });

  test("submit sets submitting during request", async () => {
    let resolveSubmit: (v: any) => void;
    mockSubmit.mockReturnValueOnce(
      new Promise((r) => {
        resolveSubmit = r;
      }),
    );

    const { submit, submitting } = useFormRelay({
      formId: "01abc",
      publicKey: "pk_fr_test",
      initialSchema: mockSchema,
    });

    const submitPromise = submit();
    expect(submitting.value).toBe(true);

    resolveSubmit!({ success: true, message: "OK" });
    await submitPromise;

    expect(submitting.value).toBe(false);
  });

  test("reset clears values, errors, and submitted", async () => {
    const { values, errors, submitted, submit, reset } = useFormRelay({
      formId: "01abc",
      publicKey: "pk_fr_test",
      initialSchema: mockSchema,
    });

    values.email = "john@example.com";
    await submit();
    expect(submitted.value).toBe(true);

    reset();

    expect(values.email).toBe("");
    expect(values.name).toBe("");
    expect(errors.value).toEqual({});
    expect(submitted.value).toBe(false);
  });

  test("does not submit when schema is not loaded", async () => {
    mockGetSchema.mockReturnValue(new Promise(() => {})); // never resolves

    const { submit } = useFormRelay({
      formId: "01abc",
      publicKey: "pk_fr_test",
    });

    await submit();

    expect(mockSubmit).not.toHaveBeenCalled();
  });

  test("canSubmit is false while bot protection token is missing", () => {
    const { canSubmit, setBotToken } = useFormRelay({
      formId: "01abc",
      publicKey: "pk_fr_test",
      initialSchema: mockSchemaWithBot,
    });

    expect(canSubmit.value).toBe(false);

    setBotToken("token");
    expect(canSubmit.value).toBe(true);
  });

  test("canSubmit is true when no bot protection is configured", () => {
    const { canSubmit } = useFormRelay({
      formId: "01abc",
      publicKey: "pk_fr_test",
      initialSchema: mockSchema,
    });

    expect(canSubmit.value).toBe(true);
  });

  test("canSubmit is false while submitting", async () => {
    let resolveSubmit: (v: any) => void;
    mockSubmit.mockReturnValueOnce(
      new Promise((r) => {
        resolveSubmit = r;
      }),
    );

    const { submit, canSubmit } = useFormRelay({
      formId: "01abc",
      publicKey: "pk_fr_test",
      initialSchema: mockSchema,
    });

    expect(canSubmit.value).toBe(true);

    const submitPromise = submit();
    expect(canSubmit.value).toBe(false);

    resolveSubmit!({ success: true, message: "OK" });
    await submitPromise;

    expect(canSubmit.value).toBe(true);
  });

  test("submit is blocked when canSubmit is false", async () => {
    const { submit } = useFormRelay({
      formId: "01abc",
      publicKey: "pk_fr_test",
      initialSchema: mockSchemaWithBot,
      // no setBotToken called — canSubmit is false
    });

    await submit();

    expect(mockSubmit).not.toHaveBeenCalled();
  });

  test("populates errors ref from server-side ValidationError", async () => {
    const validationError = new ValidationError({
      type: "https://formrelay.app/errors#validation",
      title: "Validation Failed",
      status: 422,
      detail: "The given data was invalid.",
      fieldErrors: { email: ["The email field is required."] },
    });
    mockSubmit.mockResolvedValueOnce({ success: false, error: validationError });

    const { submit, errors } = useFormRelay({
      formId: "01abc",
      publicKey: "pk_fr_test",
      initialSchema: mockSchema,
    });

    await submit();

    expect(errors.value).toEqual({ email: ["The email field is required."] });
  });

  test("reset clears bot token", async () => {
    const { values, submit, setBotToken, reset, canSubmit } = useFormRelay({
      formId: "01abc",
      publicKey: "pk_fr_test",
      initialSchema: mockSchemaWithBot,
    });

    setBotToken("old-token");
    expect(canSubmit.value).toBe(true);

    reset();
    expect(canSubmit.value).toBe(false);

    setBotToken("new-token");
    values.email = "john@example.com";
    await submit();

    expect(mockSubmit).toHaveBeenCalledWith(
      { email: "john@example.com", name: "" },
      { botToken: "new-token" },
    );
  });

  test("skips schema fetch when publicKey is not provided", async () => {
    const { schema, schemaLoading, fields, values } = useFormRelay({
      formId: "01abc",
    });

    await nextTick();
    await nextTick();

    expect(mockGetSchema).not.toHaveBeenCalled();
    expect(schemaLoading.value).toBe(false);
    expect(schema.value).toBeNull();
    expect(fields.value).toEqual([]);
    expect(Object.keys(values)).toEqual([]);
  });

  test("submit is a no-op when no schema is available", async () => {
    const { submit, values, submitting } = useFormRelay({
      formId: "01abc",
    });

    values.email = "john@example.com";
    await submit();

    expect(mockSubmit).not.toHaveBeenCalled();
    expect(submitting.value).toBe(false);
  });
});

describe("auto bot protection", () => {
  test("loads widget and starts token loop when container and schema are available", async () => {
    const container = document.createElement("div");
    const containerRef = ref<HTMLElement | null>(container);

    mountComposable({
      formId: "01abc",
      publicKey: "pk_fr_test",
      initialSchema: mockSchemaWithBot,
      botProtectionContainer: containerRef,
    });

    await flushPromises();

    const { loadBotProtectionWidget, runTokenLoop } =
      await import("@formrelay/core/bot-protection");
    expect(loadBotProtectionWidget).toHaveBeenCalledWith(
      { type: "turnstile", siteKey: "0x-key" },
      container,
    );
    expect(runTokenLoop).toHaveBeenCalledWith(mockBotWidget, expect.any(Function));
  });

  test("does not load widget when container is null", async () => {
    const containerRef = ref<HTMLElement | null>(null);

    mountComposable({
      formId: "01abc",
      publicKey: "pk_fr_test",
      initialSchema: mockSchemaWithBot,
      botProtectionContainer: containerRef,
    });

    await flushPromises();

    const { loadBotProtectionWidget } = await import("@formrelay/core/bot-protection");
    expect(loadBotProtectionWidget).not.toHaveBeenCalled();
  });

  test("does not load widget when schema has no bot protection", async () => {
    const container = document.createElement("div");
    const containerRef = ref<HTMLElement | null>(container);

    mountComposable({
      formId: "01abc",
      publicKey: "pk_fr_test",
      initialSchema: mockSchema,
      botProtectionContainer: containerRef,
    });

    await flushPromises();

    const { loadBotProtectionWidget } = await import("@formrelay/core/bot-protection");
    expect(loadBotProtectionWidget).not.toHaveBeenCalled();
  });

  test("reset calls widget.reset() when auto bot protection is active", async () => {
    const container = document.createElement("div");
    const containerRef = ref<HTMLElement | null>(container);

    const { result } = mountComposable({
      formId: "01abc",
      publicKey: "pk_fr_test",
      initialSchema: mockSchemaWithBot,
      botProtectionContainer: containerRef,
    });

    await flushPromises();

    result.reset();

    expect(mockBotWidget.reset).toHaveBeenCalled();
  });

  test("cleans up widget on unmount", async () => {
    const container = document.createElement("div");
    const containerRef = ref<HTMLElement | null>(container);

    const { wrapper } = mountComposable({
      formId: "01abc",
      publicKey: "pk_fr_test",
      initialSchema: mockSchemaWithBot,
      botProtectionContainer: containerRef,
    });

    await flushPromises();

    wrapper.unmount();

    expect(mockTokenLoopHandle.stop).toHaveBeenCalled();
  });

  test("reinitializes widget when container ref changes", async () => {
    const container1 = document.createElement("div");
    const container2 = document.createElement("div");
    const containerRef = ref<HTMLElement | null>(container1);

    mountComposable({
      formId: "01abc",
      publicKey: "pk_fr_test",
      initialSchema: mockSchemaWithBot,
      botProtectionContainer: containerRef,
    });

    await flushPromises();

    const { loadBotProtectionWidget } = await import("@formrelay/core/bot-protection");
    expect(loadBotProtectionWidget).toHaveBeenCalledTimes(1);

    // Simulate v-if: container destroyed and recreated
    containerRef.value = null;
    await flushPromises();

    expect(mockTokenLoopHandle.stop).toHaveBeenCalledTimes(1);

    containerRef.value = container2;
    await flushPromises();

    expect(loadBotProtectionWidget).toHaveBeenCalledTimes(2);
    expect(loadBotProtectionWidget).toHaveBeenLastCalledWith(
      { type: "turnstile", siteKey: "0x-key" },
      container2,
    );
  });

  test("handles widget loading failure gracefully", async () => {
    const container = document.createElement("div");
    const containerRef = ref<HTMLElement | null>(container);
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { loadBotProtectionWidget } = await import("@formrelay/core/bot-protection");
    vi.mocked(loadBotProtectionWidget).mockRejectedValueOnce(
      new Error("Script blocked by ad blocker"),
    );

    const { result } = mountComposable({
      formId: "01abc",
      publicKey: "pk_fr_test",
      initialSchema: mockSchemaWithBot,
      botProtectionContainer: containerRef,
    });

    await flushPromises();

    expect(result.canSubmit.value).toBe(false);
    expect(consoleSpy).toHaveBeenCalledWith(
      "[FormRelay] Failed to initialize bot protection:",
      expect.any(Error),
    );

    consoleSpy.mockRestore();
  });

  test("without botProtectionContainer, existing behavior is unchanged", async () => {
    const { result } = mountComposable({
      formId: "01abc",
      publicKey: "pk_fr_test",
      initialSchema: mockSchemaWithBot,
    });

    await flushPromises();

    const { loadBotProtectionWidget } = await import("@formrelay/core/bot-protection");
    expect(loadBotProtectionWidget).not.toHaveBeenCalled();

    // Manual flow still works
    result.setBotToken("manual-token");
    expect(result.canSubmit.value).toBe(true);
  });

  test("reset during active auto bot protection clears token and resets widget", async () => {
    const container = document.createElement("div");
    const containerRef = ref<HTMLElement | null>(container);

    const { runTokenLoop } = await import("@formrelay/core/bot-protection");
    // Simulate token loop calling setBotToken
    vi.mocked(runTokenLoop).mockImplementation((_widget, onToken) => {
      onToken("auto-token");
      return mockTokenLoopHandle;
    });

    const { result } = mountComposable({
      formId: "01abc",
      publicKey: "pk_fr_test",
      initialSchema: mockSchemaWithBot,
      botProtectionContainer: containerRef,
    });

    await flushPromises();

    expect(result.canSubmit.value).toBe(true);

    result.reset();

    expect(result.canSubmit.value).toBe(false);
    expect(mockBotWidget.reset).toHaveBeenCalled();
  });

  test("reinitializes widget and token loop when container ref changes", async () => {
    const container1 = document.createElement("div");
    const container2 = document.createElement("div");
    const containerRef = ref<HTMLElement | null>(container1);

    mountComposable({
      formId: "01abc",
      publicKey: "pk_fr_test",
      initialSchema: mockSchemaWithBot,
      botProtectionContainer: containerRef,
    });

    await flushPromises();

    const { loadBotProtectionWidget, runTokenLoop } =
      await import("@formrelay/core/bot-protection");
    expect(runTokenLoop).toHaveBeenCalledTimes(1);

    containerRef.value = null;
    await flushPromises();

    containerRef.value = container2;
    await flushPromises();

    expect(loadBotProtectionWidget).toHaveBeenCalledTimes(2);
    expect(runTokenLoop).toHaveBeenCalledTimes(2);
  });

  test("clears botToken when container is destroyed via v-if", async () => {
    const container = document.createElement("div");
    const containerRef = ref<HTMLElement | null>(container);

    const { runTokenLoop } = await import("@formrelay/core/bot-protection");
    vi.mocked(runTokenLoop).mockImplementation((_widget, onToken) => {
      onToken("auto-token");
      return mockTokenLoopHandle;
    });

    const { result } = mountComposable({
      formId: "01abc",
      publicKey: "pk_fr_test",
      initialSchema: mockSchemaWithBot,
      botProtectionContainer: containerRef,
    });

    await flushPromises();

    expect(result.canSubmit.value).toBe(true);

    // Simulate v-if destroying the container
    containerRef.value = null;
    await flushPromises();

    expect(result.canSubmit.value).toBe(false);
    expect(mockTokenLoopHandle.stop).toHaveBeenCalled();
  });
});
