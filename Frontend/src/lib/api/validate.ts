import type { z } from "zod";
import { ApiError, type ApiFieldErrors } from "./errors";

/**
 * Parse an outgoing request body with its contract schema before sending it.
 * Applies the schema's trimming/defaults and strips unknown keys. A failure is
 * thrown as an `ApiError` (`VALIDATION_ERROR`, with `fields`) — the exact shape
 * the server would answer with — so `useApiForm` handles both the same way.
 */
export function validateRequest<S extends z.ZodTypeAny>(
  schema: S,
  value: z.input<S>,
): z.output<S> {
  const result = schema.safeParse(value);
  if (result.success) return result.data;

  const fields: ApiFieldErrors = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join(".") || "_root";
    (fields[key] ??= []).push(issue.message);
  }
  throw new ApiError({
    status: 400,
    code: "VALIDATION_ERROR",
    message: "داده‌های ارسالی نامعتبر است.",
    fields,
    details: result.error.issues,
    cause: result.error,
  });
}
