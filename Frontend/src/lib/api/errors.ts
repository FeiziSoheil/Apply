import type { ConflictReason, ErrorCode } from "@/contracts/common";

/**
 * Error codes produced by the client itself (never sent by the server).
 * `status` is `0` for these.
 */
export const CLIENT_ERROR_CODES = [
  "NETWORK_ERROR",
  "TIMEOUT",
  "ABORTED",
  "INVALID_RESPONSE",
  "UNKNOWN",
] as const;

export type ClientErrorCode = (typeof CLIENT_ERROR_CODES)[number];
export type ApiErrorCode = ErrorCode | ClientErrorCode;

/** `fields` of the contract error: key = dotted field path */
export type ApiFieldErrors = Record<string, string[]>;

export type ApiErrorInit = {
  status: number;
  code: ApiErrorCode;
  message: string;
  fields?: ApiFieldErrors;
  /** Machine-readable conflict reason (`version_mismatch`, …) */
  reason?: ConflictReason;
  /** Current entity version when `reason === "version_mismatch"` */
  currentVersion?: number;
  /** `meta.requestId` / `X-Request-Id` for support & debugging */
  requestId?: string;
  /** Retry-After header in seconds (on 429) */
  retryAfter?: number;
  /** Extra debugging data (e.g. Zod issues of a contract violation) */
  details?: unknown;
  cause?: unknown;
};

/**
 * Error thrown by every API helper. `status`, `code`, `message` and `fields`
 * mirror the `{ error: { code, message, fields? } }` contract format.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly fields?: ApiFieldErrors;
  readonly reason?: ConflictReason;
  readonly currentVersion?: number;
  readonly requestId?: string;
  readonly retryAfter?: number;
  readonly details?: unknown;

  constructor(init: ApiErrorInit) {
    super(init.message, init.cause === undefined ? undefined : { cause: init.cause });
    this.name = "ApiError";
    this.status = init.status;
    this.code = init.code;
    this.fields = init.fields;
    this.reason = init.reason;
    this.currentVersion = init.currentVersion;
    this.requestId = init.requestId;
    this.retryAfter = init.retryAfter;
    this.details = init.details;
  }

  get retryAfterSeconds(): number | undefined {
    return this.retryAfter;
  }

  get isRateLimited(): boolean {
    return this.status === 429 || this.code === "RATE_LIMITED";
  }

  get isVersionMismatch(): boolean {
    return this.isConflict && this.reason === "version_mismatch";
  }

  /** 4xx — the request itself is wrong; retrying cannot help */
  get isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }

  get isValidationError(): boolean {
    return this.code === "VALIDATION_ERROR";
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }

  get isConflict(): boolean {
    return this.status === 409;
  }

  get isAborted(): boolean {
    return this.code === "ABORTED";
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export const DEFAULT_ERROR_MESSAGE = "خطایی رخ داد. لطفاً دوباره تلاش کنید.";

/** User-facing (Persian) message of any thrown value */
export function getApiErrorMessage(
  error: unknown,
  fallback: string = DEFAULT_ERROR_MESSAGE,
): string {
  if (isApiError(error) && error.message) return error.message;
  return fallback;
}
