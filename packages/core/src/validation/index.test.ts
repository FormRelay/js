import { describe, expect, test } from "vitest";
import { createValidator } from "./index";

const EMAIL_SCHEMA = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  type: "object",
  properties: {
    email: { type: "string", format: "email" },
    name: { type: "string", minLength: 1 },
  },
  required: ["email", "name"],
};

describe("createValidator", () => {
  test("returns valid for correct data", () => {
    const validate = createValidator(EMAIL_SCHEMA);
    const result = validate({ email: "john@example.com", name: "John" });

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  test("returns errors for missing required fields", () => {
    const validate = createValidator(EMAIL_SCHEMA);
    const result = validate({});

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  test("returns errors for invalid format", () => {
    const validate = createValidator(EMAIL_SCHEMA);
    const result = validate({ email: "not-an-email", name: "John" });

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.path.includes("email"))).toBe(true);
  });

  test("returns errors for type mismatch", () => {
    const validate = createValidator(EMAIL_SCHEMA);
    const result = validate({ email: "john@example.com", name: 123 });

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.path.includes("name"))).toBe(true);
  });

  test("validates with minimal schema (accepts any object)", () => {
    const validate = createValidator({ type: "object" });
    const result = validate({ anything: "goes" });

    expect(result.valid).toBe(true);
  });
});
