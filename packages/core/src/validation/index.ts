import { Validator } from "@cfworker/json-schema";
import type { JsonSchema } from "../types";

export interface ValidationResult {
  valid: boolean;
  errors: ValidationIssue[];
}

export interface ValidationIssue {
  path: string;
  message: string;
}

export function createValidator(
  schema: JsonSchema,
): (data: unknown) => ValidationResult {
  const validator = new Validator(schema as object, "2020-12");

  return (data: unknown): ValidationResult => {
    const result = validator.validate(data);
    return {
      valid: result.valid,
      errors: result.errors.map((e) => ({
        path: e.instanceLocation,
        message: e.error ?? `Failed ${e.keyword} validation`,
      })),
    };
  };
}
