import { describe, expect, test, vi, beforeEach } from "vitest";
import { nextTick, isRef, isReactive } from "vue";
import { createForm } from "@formrelay/core";
import { useFormRelay } from "./useFormRelay";

const mockSchema = {
  id: "01abc",
  name: "Test Form",
  isActive: true,
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
    },
  ],
  validationSchema: { type: "object" },
  honeypotField: "_hp_phone",
  botProtection: { type: "turnstile" as const, siteKey: "0x-key" },
  submitUrl: "https://formrelay.app/api/v1/form/01abc",
};

const mockGetSchema = vi.fn().mockResolvedValue(mockSchema);
const mockSubmit = vi.fn().mockResolvedValue({
  success: true,
  message: "Form submitted successfully.",
});

vi.mock("@formrelay/core", () => ({
  createForm: vi.fn(() => ({
    getSchema: mockGetSchema,
    submit: mockSubmit,
  })),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockGetSchema.mockResolvedValue(mockSchema);
  mockSubmit.mockResolvedValue({
    success: true,
    message: "Form submitted successfully.",
  });
});

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
    const { schema, fields, schemaLoading, botProtection, validationSchema } = useFormRelay({
      formId: "01abc",
      publicKey: "pk_fr_test",
    });

    expect(schemaLoading.value).toBe(true);

    await nextTick();
    await nextTick();

    expect(schemaLoading.value).toBe(false);
    expect(schema.value).toEqual(mockSchema);
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
      initialSchema: mockSchema,
    });

    expect(mockGetSchema).not.toHaveBeenCalled();
    expect(schemaLoading.value).toBe(false);
    expect(schema.value).toEqual(mockSchema);
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
    expect(schemaError.value).toBe(error);
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
      initialSchema: mockSchema,
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

  test("passes baseUrl to createForm", () => {
    useFormRelay({
      formId: "01abc",
      publicKey: "pk_fr_test",
      baseUrl: "https://custom.api.com",
    });

    expect(createForm).toHaveBeenCalledWith("01abc", {
      publicKey: "pk_fr_test",
      baseUrl: "https://custom.api.com",
    });
  });
});
