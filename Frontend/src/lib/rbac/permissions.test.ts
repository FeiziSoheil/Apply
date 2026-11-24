import { describe, expect, it } from "vitest";
import type { Role } from "@/contracts/auth";
import { can } from "./can";
import { filterByPermission } from "./nav";
import {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  isPermission,
  permissionsForRole,
  roleHasPermission,
  rolesWithPermission,
  type Permission,
} from "./permissions";

const ROLES: readonly Role[] = ["admin", "consultant", "student"];

/** The full role × permission matrix: `true` = allowed. Keep in sync with `permissions.ts`. */
const MATRIX: Record<Permission, Record<Role, boolean>> = {
  "content:read": { admin: true, consultant: true, student: false },
  "content:write": { admin: true, consultant: false, student: false },
  "content:delete": { admin: true, consultant: false, student: false },
  "lead:read": { admin: true, consultant: true, student: false },
  "lead:write": { admin: true, consultant: true, student: false },
  "lead:assign": { admin: true, consultant: false, student: false },
  "lead:delete": { admin: true, consultant: false, student: false },
  "lead:import": { admin: true, consultant: false, student: false },
  "lead:export": { admin: true, consultant: true, student: false },
  "lead:merge": { admin: true, consultant: false, student: false },
  "student:read": { admin: true, consultant: true, student: true },
  "student:write": { admin: true, consultant: true, student: true },
  "student:stage": { admin: true, consultant: true, student: false },
  "case:read": { admin: true, consultant: true, student: false },
  "case:write": { admin: true, consultant: true, student: false },
  "case:review": { admin: true, consultant: true, student: false },
  "document:upload": { admin: true, consultant: true, student: true },
  "document:review": { admin: true, consultant: true, student: false },
  "task:read": { admin: true, consultant: true, student: false },
  "task:write": { admin: true, consultant: true, student: false },
  "booking:read": { admin: true, consultant: true, student: true },
  "booking:write": { admin: true, consultant: true, student: true },
  "booking:manage": { admin: true, consultant: true, student: false },
  "ticket:read": { admin: true, consultant: true, student: true },
  "ticket:write": { admin: true, consultant: true, student: true },
  "ticket:manage": { admin: true, consultant: true, student: false },
  "payment:read": { admin: true, consultant: true, student: true },
  "payment:write": { admin: true, consultant: false, student: true },
  "payment:manage": { admin: true, consultant: false, student: false },
  "report:read": { admin: true, consultant: true, student: false },
  "crm-settings:manage": { admin: true, consultant: false, student: false },
  "audit:read": { admin: true, consultant: false, student: false },
  "user:manage": { admin: true, consultant: false, student: false },
};

describe("RBAC role × permission matrix", () => {
  it("covers every permission of the catalog", () => {
    expect(Object.keys(MATRIX).sort()).toEqual([...PERMISSIONS].sort());
  });

  it.each(PERMISSIONS)("%s matches the matrix for every role", (permission) => {
    for (const role of ROLES) {
      expect(
        roleHasPermission(role, permission),
        `${role} → ${permission}`,
      ).toBe(MATRIX[permission][role]);
    }
  });

  it("admin has every permission", () => {
    expect(permissionsForRole("admin")).toEqual([...PERMISSIONS]);
  });

  it("consultant lacks user:manage, content:write, lead:assign, crm-settings", () => {
    const granted = permissionsForRole("consultant");
    expect(granted).not.toContain("user:manage");
    expect(granted).not.toContain("content:write");
    expect(granted).not.toContain("lead:assign");
    expect(granted).not.toContain("crm-settings:manage");
    expect(granted).not.toContain("audit:read");
    expect(granted).not.toContain("lead:import");
    expect(granted).toContain("content:read");
    expect(granted).toContain("lead:export");
    expect(granted).toContain("report:read");
  });

  it("student lacks every administrative permission", () => {
    const granted = permissionsForRole("student");
    for (const denied of [
      "lead:read",
      "lead:write",
      "lead:assign",
      "lead:delete",
      "content:write",
      "content:delete",
      "student:stage",
      "booking:manage",
      "ticket:manage",
      "payment:manage",
      "user:manage",
      "crm-settings:manage",
      "audit:read",
    ] as const) {
      expect(granted).not.toContain(denied);
    }
  });

  it("only grants catalog permissions, without duplicates", () => {
    for (const role of ROLES) {
      const granted = ROLE_PERMISSIONS[role];
      expect(new Set(granted).size).toBe(granted.length);
      expect(granted.every((permission) => isPermission(permission))).toBe(true);
    }
  });

  it("can() follows the session user's permissions", () => {
    const consultant = {
      user: { role: "consultant", permissions: permissionsForRole("consultant") },
    } as const;
    expect(can(consultant, "lead:read")).toBe(true);
    expect(can(consultant, "user:manage")).toBe(false);
    expect(can(consultant, ["lead:read", "lead:assign"])).toBe(false);
    expect(can({ user: null }, "content:read")).toBe(false);
    expect(can(null, "content:read")).toBe(false);
  });

  it("rolesWithPermission derives endpoint roles from the map", () => {
    expect(rolesWithPermission("lead:assign")).toEqual(["admin"]);
    expect(rolesWithPermission("payment:write")).toEqual(["admin", "student"]);
  });

  it("filterByPermission hides menu entries the user may not see", () => {
    const items = [
      { id: "home" },
      { id: "leads", permissions: ["lead:read"] as const },
      { id: "users", permissions: ["user:manage"] as const },
    ];
    const consultant = {
      role: "consultant",
      permissions: permissionsForRole("consultant"),
    } as const;
    expect(filterByPermission(items, consultant).map((item) => item.id)).toEqual([
      "home",
      "leads",
    ]);
    expect(filterByPermission(items, null)).toEqual([]);
  });
});
