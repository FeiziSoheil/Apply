import {
  ERROR_HTTP_STATUS,
  type ErrorCode,
} from "@/contracts/common";

/** Thrown by handlers / helpers; the route runner turns it into the contract error body */
export class MockApiError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly fields?: Record<string, string[]>;
  readonly headers?: Record<string, string>;
  readonly reason?: "version_mismatch";
  readonly currentVersion?: number;

  constructor(
    code: ErrorCode,
    message: string,
    options?: {
      fields?: Record<string, string[]>;
      headers?: Record<string, string>;
      reason?: "version_mismatch";
      currentVersion?: number;
    },
  ) {
    super(message);
    this.name = "MockApiError";
    this.code = code;
    this.status = ERROR_HTTP_STATUS[code];
    this.fields = options?.fields;
    this.headers = options?.headers;
    this.reason = options?.reason;
    this.currentVersion = options?.currentVersion;
  }
}

/**
 * Developer-facing error: the mock produced a body that violates the Zod
 * contract (or the request/handler wiring is broken). Never a user error.
 */
export class MockContractViolation extends Error {
  readonly operationId: string;
  readonly issues: string[];

  constructor(operationId: string, summary: string, issues: string[]) {
    super(`[mock] ${operationId}: ${summary}\n  - ${issues.join("\n  - ")}`);
    this.name = "MockContractViolation";
    this.operationId = operationId;
    this.issues = issues;
  }
}

export const apiError = {
  validation(
    fields: Record<string, string[]>,
    message = "داده‌های ورودی نامعتبر است",
  ): MockApiError {
    return new MockApiError("VALIDATION_ERROR", message, { fields });
  },
  /** Single-field validation error */
  invalidField(field: string, message: string): MockApiError {
    return apiError.validation({ [field]: [message] });
  },
  unauthorized(message = "ابتدا وارد حساب کاربری خود شوید"): MockApiError {
    return new MockApiError("UNAUTHORIZED", message);
  },
  forbidden(message = "شما اجازه دسترسی به این بخش را ندارید"): MockApiError {
    return new MockApiError("FORBIDDEN", message);
  },
  notFound(what = "مورد درخواستی"): MockApiError {
    return new MockApiError("NOT_FOUND", `${what} پیدا نشد`);
  },
  conflict(
    message: string,
    fieldsOrOptions?:
      | Record<string, string[]>
      | {
          fields?: Record<string, string[]>;
          reason?: "version_mismatch";
          currentVersion?: number;
        },
  ): MockApiError {
    if (
      fieldsOrOptions &&
      ("reason" in fieldsOrOptions ||
        "currentVersion" in fieldsOrOptions ||
        "fields" in fieldsOrOptions)
    ) {
      const options = fieldsOrOptions as {
        fields?: Record<string, string[]>;
        reason?: "version_mismatch";
        currentVersion?: number;
      };
      return new MockApiError("CONFLICT", message, options);
    }
    return new MockApiError("CONFLICT", message, {
      fields: fieldsOrOptions as Record<string, string[]> | undefined,
    });
  },
  versionMismatch(currentVersion: number): MockApiError {
    return new MockApiError(
      "CONFLICT",
      "این رکورد توسط کاربر دیگری تغییر کرده است؛ صفحه را تازه کنید",
      { reason: "version_mismatch", currentVersion },
    );
  },
  rateLimited(retryAfterSeconds: number): MockApiError {
    return new MockApiError(
      "RATE_LIMITED",
      "تعداد درخواست‌ها بیش از حد مجاز است؛ کمی بعد دوباره تلاش کنید",
      { headers: { "Retry-After": String(retryAfterSeconds) } },
    );
  },
  internal(message = "خطای داخلی سرور"): MockApiError {
    return new MockApiError("INTERNAL", message);
  },
} as const;
