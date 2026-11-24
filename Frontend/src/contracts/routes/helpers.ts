import type {
  OpenAPIRegistry,
  ResponseConfig,
  RouteConfig,
} from "@asteasolutions/zod-to-openapi";
import type { AnyZodObject, ZodTypeAny } from "zod";
import { rolesWithPermission, type Permission } from "@/lib/rbac/permissions";
import { ALL_ROLES, STAFF_ROLES, type Role } from "../auth";
import { SESSION_SECURITY_SCHEME } from "../session";
import {
  ERROR_HTTP_STATUS,
  errorResponseSchema,
  idParamSchema,
  paginatedEnvelope,
  slugAvailabilityQuerySchema,
  slugAvailabilitySchema,
  slugParamSchema,
  successEnvelope,
  type ErrorCode,
} from "../common";
import { reorderBodySchema } from "../content";
import { z } from "../zod";

/* -------------------------------------------------------------------------- */
/*  Access policies                                                           */
/* -------------------------------------------------------------------------- */

export type Access =
  | { readonly auth: false }
  | {
      readonly auth: true;
      readonly roles: readonly Role[];
      /** RBAC permission the caller must hold (`src/lib/rbac/permissions.ts`) */
      readonly permission?: Permission;
    };

export const PUBLIC: Access = { auth: false };
export const rolesOnly = (...roles: Role[]): Access => ({ auth: true, roles });
export const ANY_USER: Access = rolesOnly(...ALL_ROLES);
export const STAFF: Access = rolesOnly(...STAFF_ROLES);
export const ADMIN: Access = rolesOnly("admin");

/**
 * Permission-guarded endpoint. The allowed roles are DERIVED from the RBAC
 * map (so the two can never drift); pass `roles` to narrow them further, e.g.
 * `requires("student:read", STAFF_ROLES)` for "all cases" (a student only sees
 * their own through the `/me/…` endpoints). Ownership (own / assigned records)
 * is enforced by the API on top of this.
 */
export const requires = (
  permission: Permission,
  roles?: readonly Role[],
): Access => ({
  auth: true,
  roles: roles ?? rolesWithPermission(permission),
  permission,
});

/** Machine-readable policy of one endpoint (mirrors `x-roles` in the spec) */
export type EndpointPolicy = {
  operationId: string;
  method: HttpMethod;
  path: string;
  tag: string;
  auth: boolean;
  roles: readonly Role[];
  permission?: Permission;
};

/* -------------------------------------------------------------------------- */
/*  Route spec                                                                */
/* -------------------------------------------------------------------------- */

export type HttpMethod = "get" | "post" | "put" | "patch" | "delete";
type SuccessStatus = 200 | 201 | 202 | 204;
type BodyContentType = "application/json" | "multipart/form-data";

export type RouteSpec = {
  method: HttpMethod;
  /** Path relative to the `/api/v1` server URL, OpenAPI style: `/leads/{id}` */
  path: string;
  tag: string;
  operationId: string;
  summary: string;
  description?: string;
  access: Access;
  params?: AnyZodObject;
  query?: AnyZodObject;
  body?: { schema: ZodTypeAny; contentType?: BodyContentType };
  success: {
    status: SuccessStatus;
    description: string;
    schema?: ZodTypeAny;
  };
  /** Operation can fail with 409 */
  conflict?: boolean;
};

const ERROR_DESCRIPTIONS: Record<ErrorCode, string> = {
  VALIDATION_ERROR: "داده‌های ورودی نامعتبر است",
  UNAUTHORIZED: "احراز هویت انجام نشده یا نشست (کوکی `session`) نامعتبر/منقضی است",
  FORBIDDEN: "دسترسی به این منبع برای نقش فعلی مجاز نیست",
  NOT_FOUND: "منبع پیدا نشد",
  CONFLICT: "تعارض با وضعیت فعلی منبع",
  RATE_LIMITED: "تعداد درخواست‌ها بیش از حد مجاز است",
  INTERNAL: "خطای داخلی سرور",
};

function errorResponse(code: ErrorCode): ResponseConfig {
  return {
    description: `\`${code}\` — ${ERROR_DESCRIPTIONS[code]}`,
    content: { "application/json": { schema: errorResponseSchema } },
  };
}

const ROLE_LABELS: Record<Role, string> = {
  admin: "مدیر (admin)",
  consultant: "مشاور (consultant)",
  student: "دانشجو (student)",
};

function describeAccess(access: Access): string {
  if (!access.auth) return "**دسترسی:** عمومی (بدون نیاز به ورود)";
  const permission = access.permission
    ? ` — مجوز لازم: \`${access.permission}\``
    : "";
  return `**دسترسی:** نیازمند ورود — نقش‌های مجاز: ${access.roles
    .map((role) => ROLE_LABELS[role])
    .join("، ")}${permission}`;
}

export class RouteRegistrar {
  readonly policies: EndpointPolicy[] = [];
  /** Full route specs (schemas included) — consumed by the mock API (`src/mocks`) */
  readonly specs: RouteSpec[] = [];

  constructor(readonly registry: OpenAPIRegistry) {}

  route(spec: RouteSpec): void {
    this.specs.push(spec);
    const { access, success } = spec;
    const hasInput = Boolean(spec.params ?? spec.query ?? spec.body);
    const hasIdParam = Boolean(spec.params);
    const codes = new Set<ErrorCode>(["RATE_LIMITED", "INTERNAL"]);
    if (hasInput) codes.add("VALIDATION_ERROR");
    if (access.auth) {
      codes.add("UNAUTHORIZED");
      if (access.roles.length < ALL_ROLES.length) codes.add("FORBIDDEN");
      // Ownership checks (students see only their own data) can also deny
      if (access.roles.includes("student") && hasIdParam) codes.add("FORBIDDEN");
    }
    if (hasIdParam) codes.add("NOT_FOUND");
    if (spec.conflict) codes.add("CONFLICT");

    const responses: RouteConfig["responses"] = {
      [success.status]: {
        description: success.description,
        ...(success.schema
          ? {
              content: { "application/json": { schema: success.schema } },
            }
          : {}),
      },
    };
    for (const code of codes) {
      responses[ERROR_HTTP_STATUS[code]] = errorResponse(code);
    }

    const roles = access.auth ? access.roles : [];
    this.registry.registerPath({
      method: spec.method,
      path: spec.path,
      tags: [spec.tag],
      operationId: spec.operationId,
      summary: spec.summary,
      description: [spec.description, describeAccess(access)]
        .filter(Boolean)
        .join("\n\n"),
      security: access.auth ? [{ [SESSION_SECURITY_SCHEME]: [] }] : [],
      "x-auth": access.auth,
      "x-roles": [...roles],
      ...(access.auth && access.permission
        ? { "x-permission": access.permission }
        : {}),
      request: {
        params: spec.params,
        query: spec.query,
        body: spec.body
          ? {
              required: true,
              content: {
                [spec.body.contentType ?? "application/json"]: {
                  schema: spec.body.schema,
                },
              },
            }
          : undefined,
      },
      responses,
    });

    this.policies.push({
      operationId: spec.operationId,
      method: spec.method,
      path: spec.path,
      tag: spec.tag,
      auth: access.auth,
      roles,
      ...(access.auth && access.permission ? { permission: access.permission } : {}),
    });
  }

  /** Standard REST CRUD for a content resource */
  crud(config: CrudConfig): void {
    const { tag, basePath, singular, plural, fa, entity, access } = config;
    const entityResponse = successEnvelope(`${singular}Response`, entity);

    this.route({
      method: "get",
      path: basePath,
      tag,
      operationId: `list${plural}`,
      summary: `فهرست ${fa.plural}`,
      access: access.read,
      query: config.query,
      success: {
        status: 200,
        description: `فهرست صفحه‌بندی‌شده ${fa.plural}`,
        schema: paginatedEnvelope(`${plural}Page`, entity),
      },
    });

    this.route({
      method: "post",
      path: basePath,
      tag,
      operationId: `create${singular}`,
      summary: `ایجاد ${fa.singular}`,
      access: access.write,
      body: { schema: config.create },
      success: { status: 201, description: `${fa.singular} ایجاد شد`, schema: entityResponse },
      conflict: true,
    });

    if (config.bySlug) {
      this.route({
        method: "get",
        path: `${basePath}/slug-available`,
        tag,
        operationId: `check${singular}SlugAvailable`,
        summary: `بررسی یکتایی اسلاگ ${fa.singular}`,
        description:
          "برای فرم ایجاد/ویرایش: آیا اسلاگ آزاد است؟ هنگام ویرایش با `excludeId` اسلاگ فعلی را از بررسی کنار بگذارید.",
        access: access.write,
        query: slugAvailabilityQuerySchema,
        success: {
          status: 200,
          description: "نتیجهٔ بررسی یکتایی اسلاگ",
          schema: successEnvelope(
            `${singular}SlugAvailabilityResponse`,
            slugAvailabilitySchema,
          ),
        },
      });

      this.route({
        method: "get",
        path: `${basePath}/slug/{slug}`,
        tag,
        operationId: `get${singular}BySlug`,
        summary: `دریافت ${fa.singular} با اسلاگ`,
        access: access.read,
        params: slugParamSchema,
        success: { status: 200, description: fa.singular, schema: entityResponse },
      });
    }

    this.route({
      method: "get",
      path: `${basePath}/{id}`,
      tag,
      operationId: `get${singular}`,
      summary: `دریافت ${fa.singular}`,
      access: access.read,
      params: idParamSchema,
      success: { status: 200, description: fa.singular, schema: entityResponse },
    });

    this.route({
      method: "patch",
      path: `${basePath}/{id}`,
      tag,
      operationId: `update${singular}`,
      summary: `ویرایش ${fa.singular}`,
      description:
        "فقط فیلدهای ارسال‌شده تغییر می‌کنند؛ فیلدهای حذف‌شده از بدنه دست‌نخورده می‌مانند.",
      access: access.write,
      params: idParamSchema,
      body: { schema: config.update },
      success: { status: 200, description: `${fa.singular} ویرایش شد`, schema: entityResponse },
      conflict: true,
    });

    this.route({
      method: "delete",
      path: `${basePath}/{id}`,
      tag,
      operationId: `delete${singular}`,
      summary: `حذف ${fa.singular}`,
      access: access.delete ?? access.write,
      params: idParamSchema,
      success: { status: 204, description: `${fa.singular} حذف شد` },
      conflict: true,
    });

    if (config.reorderable) {
      this.route({
        method: "post",
        path: `${basePath}/reorder`,
        tag,
        operationId: `reorder${plural}`,
        summary: `بازنشانی ترتیب ${fa.plural}`,
        description:
          "لیستی از `{ id, order }` می‌پذیرد و فیلد `order` هر مورد را به‌روز می‌کند.",
        access: access.write,
        body: { schema: reorderBodySchema },
        success: {
          status: 200,
          description: `ترتیب ${fa.plural} به‌روز شد`,
          schema: successEnvelope(
            `${plural}ReorderResponse`,
            z.object({ updated: z.number().int().min(0) }),
          ),
        },
      });
    }
  }
}

export type CrudConfig = {
  tag: string;
  basePath: string;
  /** PascalCase names used for operationIds / component names */
  singular: string;
  plural: string;
  /** Persian labels used in summaries */
  fa: { singular: string; plural: string };
  entity: ZodTypeAny;
  create: ZodTypeAny;
  update: ZodTypeAny;
  query: AnyZodObject;
  access: { read: Access; write: Access; delete?: Access };
  /** Also expose `GET {basePath}/slug/{slug}` and slug-available */
  bySlug?: boolean;
  /** Also expose `POST {basePath}/reorder` */
  reorderable?: boolean;
};
