import { HttpResponse, http, type HttpHandler } from "msw";
import type { z } from "zod";
import { endpointSpecs } from "@/contracts/registry";
import type { RouteSpec } from "@/contracts/routes/helpers";
import {
  errorResponseSchema,
  type ErrorCode,
} from "@/contracts/common";
import type { Role } from "@/contracts/auth";
import { getApiPrefix } from "./config";
import { getDb } from "./db";
import {
  MockApiError,
  MockContractViolation,
  apiError,
} from "./errors";
import {
  MOCK_SCENARIO_QUERY_PARAM,
  readScenario,
  scenarioError,
  type MockScenarioId,
} from "./scenarios";
import { assertPermission } from "./domain/users";
import { resolveUser } from "./session";
import type { MockUser, ResponseMeta } from "./types";
import { newId, simulateLatency, type ApiResult } from "./utils";

/* -------------------------------------------------------------------------- */
/*  Handler authoring API                                                     */
/* -------------------------------------------------------------------------- */

type RouteInput = { params?: unknown; query?: unknown; body?: unknown };
type Field<I, K extends string> = I extends Record<K, infer V> ? V : undefined;

/**
 * What a handler receives. `params` / `query` / `body` are already parsed
 * with the route's contract schemas, so their types are the schema outputs
 * (pass them as the generic: `defineRoute<{ body: LeadCreate }>(…)`).
 */
export type HandlerContext<I extends RouteInput = RouteInput> = {
  params: Field<I, "params">;
  query: Field<I, "query">;
  body: Field<I, "body">;
  /** Authenticated user (always set when the route policy requires auth) */
  user: MockUser | null;
  request: Request;
  url: URL;
  /** Origin the client is talking to (for absolute file / gateway URLs) */
  origin: string;
};

type AnyContext = HandlerContext<{
  params: unknown;
  query: unknown;
  body: unknown;
}>;

export type RouteImplementation = {
  run: (ctx: AnyContext) => ApiResult | Promise<ApiResult>;
  /**
   * `true`: the body is passed through unparsed (`unknown`) and the handler
   * validates it itself — used where the contract defines non-error behaviour
   * for "invalid" input (the quick-contact honeypot).
   */
  rawBody: boolean;
};

export type RouteImplementations = Readonly<Record<string, RouteImplementation>>;

export function defineRoute<I extends RouteInput = RouteInput>(
  run: (ctx: HandlerContext<I>) => ApiResult | Promise<ApiResult>,
  options?: { rawBody?: boolean },
): RouteImplementation {
  return {
    // Runtime shape is guaranteed by the schemas of the matching route spec
    run: run as unknown as RouteImplementation["run"],
    rawBody: options?.rawBody ?? false,
  };
}

/** Parse `value` with `schema`; failures become a contract `VALIDATION_ERROR` */
export function parseOrThrow<S extends z.ZodTypeAny>(
  schema: S,
  value: unknown,
): z.output<S> {
  const result = schema.safeParse(value);
  if (result.success) return result.data;
  throw apiError.validation(issuesToFields(result.error));
}

function issuesToFields(error: z.ZodError): Record<string, string[]> {
  const fields: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_root";
    (fields[key] ??= []).push(issue.message);
  }
  return fields;
}

/* -------------------------------------------------------------------------- */
/*  Route runner                                                              */
/* -------------------------------------------------------------------------- */

function toMswPath(path: string): string {
  return `*${getApiPrefix()}${path.replace(/\{(\w+)\}/g, ":$1")}`;
}

function describe(spec: RouteSpec): string {
  return `${spec.method.toUpperCase()} ${spec.path} (${spec.operationId})`;
}

async function readJsonBody(request: Request): Promise<unknown> {
  const text = await request.text();
  if (!text.trim()) return {};
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw apiError.invalidField("_root", "بدنه درخواست JSON معتبر نیست");
  }
}

function queryToObject(url: URL): Record<string, string | string[]> {
  const result: Record<string, string | string[]> = {};
  for (const [key, value] of url.searchParams) {
    if (key === MOCK_SCENARIO_QUERY_PARAM) continue;
    const existing = result[key];
    if (existing === undefined) result[key] = value;
    else result[key] = Array.isArray(existing) ? [...existing, value] : [existing, value];
  }
  return result;
}

function authorize(
  spec: RouteSpec,
  request: Request,
): MockUser | null {
  if (!spec.access.auth) {
    // Public endpoints still see the session (e.g. a logged-in booking)
    return resolveUser(request, null);
  }
  const roles: readonly Role[] = spec.access.roles;
  const user = resolveUser(request, roles);
  if (!user) throw apiError.unauthorized();
  if (!roles.includes(user.role)) throw apiError.forbidden();
  // Permission-based policy (RBAC): the role list above is derived from the
  // same map, so this only differs when a route narrows the roles on top
  if (spec.access.permission) assertPermission(user, spec.access.permission);
  return user;
}

async function parseInput(
  spec: RouteSpec,
  impl: RouteImplementation,
  request: Request,
  url: URL,
  rawParams: Record<string, string | readonly string[] | undefined>,
): Promise<{ params: unknown; query: unknown; body: unknown }> {
  const fieldErrors: Record<string, string[]> = {};
  const merge = (errors: Record<string, string[]>) => {
    for (const [key, messages] of Object.entries(errors)) {
      (fieldErrors[key] ??= []).push(...messages);
    }
  };

  let params: unknown = undefined;
  if (spec.params) {
    const flat = Object.fromEntries(
      Object.entries(rawParams).map(([key, value]) => [
        key,
        Array.isArray(value) ? value[0] : value,
      ]),
    );
    const parsed = spec.params.safeParse(flat);
    if (parsed.success) params = parsed.data;
    else merge(issuesToFields(parsed.error));
  }

  let query: unknown = undefined;
  if (spec.query) {
    const parsed = spec.query.safeParse(queryToObject(url));
    if (parsed.success) query = parsed.data;
    else merge(issuesToFields(parsed.error));
  }

  let body: unknown = undefined;
  if (spec.body) {
    if (spec.body.contentType === "multipart/form-data") {
      try {
        body = await request.formData();
      } catch {
        merge({ file: ["فایل به‌صورت multipart/form-data ارسال نشده است"] });
      }
    } else {
      const raw = await readJsonBody(request);
      if (impl.rawBody) {
        body = raw;
      } else {
        const parsed = spec.body.schema.safeParse(raw);
        if (parsed.success) body = parsed.data;
        else merge(issuesToFields(parsed.error));
      }
    }
  }

  if (Object.keys(fieldErrors).length > 0) throw apiError.validation(fieldErrors);
  return { params, query, body };
}

/** Field names the `validation_error` scenario points at */
async function candidateFieldNames(request: Request, url: URL): Promise<string[]> {
  if (request.method !== "GET" && request.method !== "DELETE") {
    try {
      const raw: unknown = JSON.parse(await request.clone().text());
      if (raw && typeof raw === "object" && !Array.isArray(raw)) {
        return Object.keys(raw);
      }
    } catch {
      // not JSON — fall through to the query string
    }
  }
  return Object.keys(queryToObject(url));
}

function emptied(result: ApiResult): ApiResult {
  const pagination = result.meta?.pagination;
  if (pagination) {
    return {
      ...result,
      data: [],
      meta: {
        ...result.meta,
        pagination: { ...pagination, total: 0, totalPages: 0 },
      },
    };
  }
  if (Array.isArray(result.data)) return { ...result, data: [] };
  return result;
}

/** Find where two JSON values differ (to report fields the contract does not know) */
function findDifferences(
  actual: unknown,
  parsed: unknown,
  path: string,
  out: string[],
): void {
  if (out.length >= 6) return;
  if (Array.isArray(actual) && Array.isArray(parsed)) {
    actual.forEach((item, index) =>
      findDifferences(item, parsed[index], `${path}[${index}]`, out),
    );
    return;
  }
  if (
    actual && parsed && typeof actual === "object" && typeof parsed === "object" &&
    !Array.isArray(actual) && !Array.isArray(parsed)
  ) {
    const actualRecord = actual as Record<string, unknown>;
    const parsedRecord = parsed as Record<string, unknown>;
    for (const key of Object.keys(actualRecord)) {
      if (!(key in parsedRecord)) out.push(`${path}.${key}: not part of the contract schema (stripped)`);
      else findDifferences(actualRecord[key], parsedRecord[key], `${path}.${key}`, out);
    }
    return;
  }
  if (JSON.stringify(actual) !== JSON.stringify(parsed)) {
    out.push(`${path}: value changed by the schema (${JSON.stringify(actual)} → ${JSON.stringify(parsed)})`);
  }
}

/**
 * Validate the success body with the contract envelope schema. A mismatch is a
 * *mock* bug (bad seed / handler), reported as `MockContractViolation`.
 */
function validateSuccessBody(spec: RouteSpec, body: unknown): unknown {
  const schema = spec.success.schema;
  if (!schema) return body;
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new MockContractViolation(
      spec.operationId,
      `response body violates the contract of ${describe(spec)}`,
      parsed.error.issues
        .slice(0, 8)
        .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`),
    );
  }
  // The schema strips unknown keys; if it changed anything, the mock leaked data
  const normalized: unknown = JSON.parse(JSON.stringify(body));
  const differences: string[] = [];
  findDifferences(normalized, JSON.parse(JSON.stringify(parsed.data)), "$", differences);
  if (differences.length > 0) {
    throw new MockContractViolation(
      spec.operationId,
      `response body of ${describe(spec)} contains data outside the contract`,
      differences,
    );
  }
  return normalized;
}

function errorResponse(
  error: MockApiError,
  requestId: string,
  scenario: MockScenarioId | null,
): Response {
  const body = {
    error: {
      code: error.code,
      message: error.message,
      ...(error.fields ? { fields: error.fields } : {}),
      ...(error.reason ? { reason: error.reason } : {}),
      ...(error.currentVersion !== undefined
        ? { currentVersion: error.currentVersion }
        : {}),
    },
  };
  const parsed = errorResponseSchema.safeParse(body);
  if (!parsed.success) {
    throw new MockContractViolation(
      "error-response",
      "error body violates ErrorResponse",
      parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`),
    );
  }
  return HttpResponse.json(body, {
    status: error.status,
    headers: {
      "x-request-id": requestId,
      ...(scenario ? { "x-mock-scenario-applied": scenario } : {}),
      ...error.headers,
    },
  });
}

function violationResponse(error: unknown, requestId: string): Response {
  const message =
    error instanceof Error ? error.message : "Unexpected error in the mock API";
  console.error(error);
  const code: ErrorCode = "INTERNAL";
  return HttpResponse.json(
    { error: { code, message } },
    {
      status: 500,
      headers: {
        "x-request-id": requestId,
        "x-mock-contract-violation": error instanceof MockContractViolation ? "true" : "false",
      },
    },
  );
}

function createHandler(spec: RouteSpec, impl: RouteImplementation): HttpHandler {
  return http[spec.method](toMswPath(spec.path), async ({ request, params }) => {
    const requestId = `req_${newId().replaceAll("-", "").slice(0, 16)}`;
    const url = new URL(request.url);
    const scenario = readScenario(request, url);

    try {
      await simulateLatency(scenario === "slow");

      const forced = scenarioError(scenario, await candidateFieldNames(request, url));
      if (forced) throw forced;

      const user = authorize(spec, request);
      const input = await parseInput(spec, impl, request, url, params);

      const raw = await impl.run({
        ...input,
        user,
        request,
        url,
        origin: url.origin,
      });
      const result = scenario === "empty" ? emptied(raw) : raw;

      if (spec.method !== "get") getDb().persist();

      const headers: Record<string, string> = {
        "x-request-id": requestId,
        ...result.headers,
      };
      if (spec.success.status === 204 || result.status === 204) {
        return new HttpResponse(null, { status: 204, headers });
      }

      // The request id travels in the `x-request-id` header; response schemas
      // only allow `meta.pagination`, so nothing else is added to `meta`.
      const meta: ResponseMeta | undefined = result.meta;
      const body = validateSuccessBody(spec, { data: result.data, meta });
      return HttpResponse.json(body as object, { status: result.status, headers });
    } catch (error) {
      if (error instanceof MockApiError) {
        return errorResponse(error, requestId, scenario);
      }
      return violationResponse(error, requestId);
    }
  });
}

/* -------------------------------------------------------------------------- */
/*  Wiring                                                                    */
/* -------------------------------------------------------------------------- */

/** Static segments before parameters, so `/bookings/slots` wins over `/bookings/:id` */
function specificity(spec: RouteSpec): number {
  return (spec.path.match(/\{/g) ?? []).length;
}

/**
 * Build one MSW handler per contract endpoint. Throws (developer error) when
 * an endpoint has no implementation or an implementation has no endpoint, so
 * the mock can never silently drift from `src/contracts`.
 */
export function createContractHandlers(
  implementations: RouteImplementations,
): HttpHandler[] {
  const known = new Set(endpointSpecs.map((spec) => spec.operationId));
  const missing = endpointSpecs
    .filter((spec) => !implementations[spec.operationId])
    .map(describe);
  const extra = Object.keys(implementations).filter((id) => !known.has(id));

  if (missing.length > 0 || extra.length > 0) {
    throw new Error(
      [
        "[mock] The mock handlers are out of sync with src/contracts.",
        ...missing.map((entry) => `  missing implementation: ${entry}`),
        ...extra.map((id) => `  unknown operationId (no such endpoint): ${id}`),
      ].join("\n"),
    );
  }

  return [...endpointSpecs]
    .sort((a, b) => specificity(a) - specificity(b))
    .map((spec) => createHandler(spec, implementations[spec.operationId]));
}
