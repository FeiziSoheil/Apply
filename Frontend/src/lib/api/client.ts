import { z } from "zod";
import {
  ERROR_HTTP_STATUS,
  errorResponseSchema,
  paginationSchema,
  responseMetaSchema,
  type ErrorCode,
  type Pagination,
} from "@/contracts/common";
import { ApiError, type ApiErrorCode } from "./errors";
import { getMockScenarioHeaders } from "./mock-scenario";
import {
  clearSession,
  handleForbidden,
  handleUnauthorized,
} from "./session";
import { getSessionAdapter } from "./session-adapter";

/* -------------------------------------------------------------------------- */
/*  Configuration                                                             */
/* -------------------------------------------------------------------------- */

export const DEFAULT_API_BASE_URL = "/api/v1";
export const DEFAULT_TIMEOUT_MS = 15_000;
export const UPLOAD_TIMEOUT_MS = 60_000;

const IS_DEV = process.env.NODE_ENV !== "production";

/**
 * Base URL of the API (no trailing slash). Relative bases (`/api/v1`) can only
 * be used by `fetch` in the browser, so on the server they are resolved against
 * the public site origin.
 */
export function getApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim() || DEFAULT_API_BASE_URL;
  const base = raw.replace(/\/+$/, "");
  if (typeof window !== "undefined" || /^https?:\/\//i.test(base)) return base;
  const origin = (
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ).replace(/\/+$/, "");
  return `${origin}${base.startsWith("/") ? "" : "/"}${base}`;
}

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Any plain object works as a query (e.g. `z.input<typeof listQuerySchema>`).
 * Values are serialized by `buildUrl`; arrays repeat the key.
 */
export type QueryInput = object;

export type RequestOptions = {
  /** Query-string parameters; `undefined`, `null` and `""` are skipped */
  query?: QueryInput;
  /** Cancels the request (TanStack Query passes its `signal` here) */
  signal?: AbortSignal;
  /** Abort after this many ms (default 15 s) */
  timeoutMs?: number;
  headers?: Record<string, string>;
  /**
   * Do not clear the session / redirect to login on 401. Use for endpoints
   * where 401 is an expected business result (wrong credentials, OTP, …).
   */
  skipAuthRedirect?: boolean;
  /** Passed to `fetch` as-is — handy for Next.js `cache` / `next.revalidate` */
  fetchInit?: Pick<RequestInit, "cache" | "next">;
};

export type Paginated<T> = {
  items: T[];
  pagination: Pagination;
};

const LOGOUT_PATH = "/auth/logout";

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/* -------------------------------------------------------------------------- */
/*  URL building                                                              */
/* -------------------------------------------------------------------------- */

function appendParam(
  search: URLSearchParams,
  key: string,
  value: unknown,
): void {
  if (value === undefined || value === null || value === "") return;
  if (Array.isArray(value)) {
    for (const item of value) appendParam(search, key, item);
    return;
  }
  if (value instanceof Date) {
    search.append(key, value.toISOString());
    return;
  }
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    search.append(key, String(value));
  }
}

export function buildUrl(path: string, query?: QueryInput): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const search = new URLSearchParams();
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      appendParam(search, key, value);
    }
  }
  const qs = search.toString();
  return `${getApiBaseUrl()}${normalizedPath}${qs ? `?${qs}` : ""}`;
}

/** Encode a dynamic path segment (`id`, `slug`, …) */
export function segment(value: string): string {
  return encodeURIComponent(value);
}

/* -------------------------------------------------------------------------- */
/*  Error helpers                                                             */
/* -------------------------------------------------------------------------- */

const STATUS_TO_CODE = new Map<number, ErrorCode>(
  (Object.entries(ERROR_HTTP_STATUS) as [ErrorCode, number][]).map(
    ([code, status]) => [status, code],
  ),
);

const FALLBACK_MESSAGES: Record<ApiErrorCode, string> = {
  VALIDATION_ERROR: "داده‌های ارسالی نامعتبر است.",
  UNAUTHORIZED: "نشست شما منقضی شده است. لطفاً دوباره وارد شوید.",
  FORBIDDEN: "شما اجازه دسترسی به این بخش را ندارید.",
  NOT_FOUND: "مورد درخواستی پیدا نشد.",
  CONFLICT: "این درخواست با وضعیت فعلی سازگار نیست.",
  RATE_LIMITED: "تعداد درخواست‌ها زیاد است. کمی بعد دوباره تلاش کنید.",
  INTERNAL: "خطای سرور. لطفاً کمی بعد دوباره تلاش کنید.",
  NETWORK_ERROR: "ارتباط با سرور برقرار نشد. اتصال اینترنت را بررسی کنید.",
  TIMEOUT: "پاسخ سرور بیش از حد طول کشید. دوباره تلاش کنید.",
  ABORTED: "درخواست لغو شد.",
  INVALID_RESPONSE: "پاسخ دریافتی از سرور معتبر نیست.",
  UNKNOWN: "خطایی رخ داد. لطفاً دوباره تلاش کنید.",
};

function codeFromStatus(status: number): ApiErrorCode {
  const known = STATUS_TO_CODE.get(status);
  if (known) return known;
  return status >= 500 ? "INTERNAL" : "UNKNOWN";
}

function clientError(
  code: ApiErrorCode,
  extra?: { cause?: unknown; details?: unknown; message?: string },
): ApiError {
  return new ApiError({
    status: 0,
    code,
    message: extra?.message ?? FALLBACK_MESSAGES[code],
    cause: extra?.cause,
    details: extra?.details,
  });
}

function formatIssues(error: z.ZodError): string {
  return error.issues
    .slice(0, 5)
    .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("; ");
}

function contractViolation(
  method: Method,
  path: string,
  error: z.ZodError,
  response: Response,
): ApiError {
  const label = `${method} ${path}`;
  if (IS_DEV) {
    console.error(
      `[api] Response of ${label} violates the contract (src/contracts).`,
      error.issues,
    );
  }
  return new ApiError({
    status: response.status,
    code: "INVALID_RESPONSE",
    message: IS_DEV
      ? `پاسخ ${label} با قرارداد API مطابقت ندارد — ${formatIssues(error)}`
      : FALLBACK_MESSAGES.INVALID_RESPONSE,
    requestId: response.headers.get("x-request-id") ?? undefined,
    details: error.issues,
    cause: error,
  });
}

function buildHttpError(
  response: Response,
  payload: unknown,
): ApiError {
  const requestId = response.headers.get("x-request-id") ?? undefined;
  const retryHeader = response.headers.get("retry-after");
  const parsedRetry = retryHeader ? parseInt(retryHeader, 10) : undefined;
  const retryAfter = Number.isFinite(parsedRetry) ? parsedRetry : undefined;

  const parsed = errorResponseSchema.safeParse(payload);
  if (parsed.success) {
    const { code, message, fields, reason, currentVersion } = parsed.data.error;
    return new ApiError({
      status: response.status,
      code,
      message: message || FALLBACK_MESSAGES[code],
      fields,
      reason,
      currentVersion,
      requestId,
      retryAfter,
    });
  }
  // Proxy / gateway / framework error that does not follow the contract
  const code = codeFromStatus(response.status);
  return new ApiError({
    status: response.status,
    code,
    message: FALLBACK_MESSAGES[code],
    requestId,
    details: payload,
    retryAfter,
  });
}

/* -------------------------------------------------------------------------- */
/*  Core request                                                              */
/* -------------------------------------------------------------------------- */

type ExecuteResult = {
  response: Response;
  /** Parsed JSON body; `undefined` for empty bodies (204) */
  payload: unknown;
};

function isBodyInit(body: unknown): body is FormData | Blob | URLSearchParams {
  return (
    (typeof FormData !== "undefined" && body instanceof FormData) ||
    (typeof Blob !== "undefined" && body instanceof Blob) ||
    body instanceof URLSearchParams
  );
}

async function execute(
  method: Method,
  path: string,
  body: unknown,
  options: RequestOptions,
): Promise<ExecuteResult> {
  const {
    query,
    signal,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    headers: extraHeaders,
    fetchInit,
  } = options;

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...getMockScenarioHeaders(), // `{}` unless the dev mock API has a scenario selected
    ...extraHeaders,
  };
  // Session transport: cookie only (real) or in-memory Bearer (mock)
  const adapter = getSessionAdapter();
  if (adapter.kind === "cookie") {
    for (const name of Object.keys(headers)) {
      if (name.toLowerCase() === "authorization") delete headers[name];
    }
  }
  Object.assign(headers, adapter.getRequestHeaders(path));

  let requestBody: BodyInit | undefined;
  if (body !== undefined) {
    if (isBodyInit(body)) {
      requestBody = body; // browser sets the multipart boundary itself
    } else {
      headers["Content-Type"] = "application/json";
      requestBody = JSON.stringify(body);
    }
  }

  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  const onExternalAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener("abort", onExternalAbort, { once: true });
  }

  try {
    const response = await fetch(buildUrl(path, query), {
      ...fetchInit,
      method,
      headers,
      body: requestBody,
      credentials: "include",
      signal: controller.signal,
    });
    const text = await response.text();

    let payload: unknown;
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch (cause) {
        if (response.ok) {
          throw clientError("INVALID_RESPONSE", {
            cause,
            message: IS_DEV
              ? `پاسخ ${method} ${path} JSON معتبر نیست.`
              : undefined,
          });
        }
        payload = undefined; // non-JSON error page; handled as generic HTTP error
      }
    }
    return { response, payload };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (timedOut) throw clientError("TIMEOUT", { cause: error });
    if (signal?.aborted || controller.signal.aborted) {
      throw clientError("ABORTED", { cause: error });
    }
    throw clientError("NETWORK_ERROR", { cause: error });
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onExternalAbort);
  }
}

async function send(
  method: Method,
  path: string,
  body: unknown,
  options: RequestOptions,
): Promise<ExecuteResult> {
  const result = await execute(method, path, body, options);
  if (result.response.ok) {
    getSessionAdapter().onResponse(result.response);
    if (path === LOGOUT_PATH) clearSession();
    return result;
  }

  const error = buildHttpError(result.response, result.payload);
  if (error.status === 401 && !options.skipAuthRedirect) {
    handleUnauthorized();
  } else if (error.status === 403) {
    handleForbidden(error);
  }
  throw error;
}

/* -------------------------------------------------------------------------- */
/*  Envelope parsing                                                          */
/* -------------------------------------------------------------------------- */

function parseEnvelope<S extends z.ZodTypeAny>(
  method: Method,
  path: string,
  result: ExecuteResult,
  schema: S,
): z.output<S> {
  const envelope = z.object({
    data: schema,
    meta: responseMetaSchema.optional(),
  });
  const parsed = envelope.safeParse(result.payload);
  if (!parsed.success) {
    throw contractViolation(method, path, parsed.error, result.response);
  }
  return parsed.data.data;
}

function parsePage<S extends z.ZodTypeAny>(
  method: Method,
  path: string,
  result: ExecuteResult,
  item: S,
): Paginated<z.output<S>> {
  const envelope = z.object({
    data: z.array(item),
    meta: z.object({ pagination: paginationSchema }),
  });
  const parsed = envelope.safeParse(result.payload);
  if (!parsed.success) {
    throw contractViolation(method, path, parsed.error, result.response);
  }
  return {
    items: parsed.data.data,
    pagination: parsed.data.meta.pagination,
  };
}

/* -------------------------------------------------------------------------- */
/*  Public helpers                                                            */
/* -------------------------------------------------------------------------- */

/** `GET` → unwrap `{ data }` and validate it with `schema` */
export async function apiGet<S extends z.ZodTypeAny>(
  path: string,
  schema: S,
  options: RequestOptions = {},
): Promise<z.output<S>> {
  const result = await send("GET", path, undefined, options);
  return parseEnvelope("GET", path, result, schema);
}

/** `GET` of a paginated list → `{ items, pagination }` (items validated with `item`) */
export async function apiGetPage<S extends z.ZodTypeAny>(
  path: string,
  item: S,
  options: RequestOptions = {},
): Promise<Paginated<z.output<S>>> {
  const result = await send("GET", path, undefined, options);
  return parsePage("GET", path, result, item);
}

/** `POST` with a body → unwrap `{ data }` */
export async function apiPost<S extends z.ZodTypeAny>(
  path: string,
  schema: S,
  body?: unknown,
  options: RequestOptions = {},
): Promise<z.output<S>> {
  const result = await send("POST", path, body, options);
  return parseEnvelope("POST", path, result, schema);
}

/** `POST` that answers `204 No Content` */
export async function apiPostVoid(
  path: string,
  body?: unknown,
  options: RequestOptions = {},
): Promise<void> {
  await send("POST", path, body, options);
}

export async function apiPut<S extends z.ZodTypeAny>(
  path: string,
  schema: S,
  body?: unknown,
  options: RequestOptions = {},
): Promise<z.output<S>> {
  const result = await send("PUT", path, body, options);
  return parseEnvelope("PUT", path, result, schema);
}

export async function apiPatch<S extends z.ZodTypeAny>(
  path: string,
  schema: S,
  body?: unknown,
  options: RequestOptions = {},
): Promise<z.output<S>> {
  const result = await send("PATCH", path, body, options);
  return parseEnvelope("PATCH", path, result, schema);
}

/** `DELETE` that answers `204 No Content` */
export async function apiDelete(
  path: string,
  options: RequestOptions = {},
): Promise<void> {
  await send("DELETE", path, undefined, options);
}

/** Namespaced access: `api.get(...)`, `api.post(...)`, … */
export const api = {
  get: apiGet,
  getPage: apiGetPage,
  post: apiPost,
  postVoid: apiPostVoid,
  put: apiPut,
  patch: apiPatch,
  delete: apiDelete,
} as const;
