import { parseAsStringLiteral, type Values } from "nuqs";
import type { StaffUserListQuery } from "@/contracts/users";
import { USER_STATUSES } from "@/contracts/users";
import { STAFF_ROLES } from "@/contracts/auth";
import type { TableUrlParams } from "@/components/admin/data-table/use-table-url-state";

const SORT_FIELDS = [
  "name",
  "email",
  "role",
  "status",
  "lastLoginAt",
  "createdAt",
] as const;

export const userFilterParsers = {
  role: parseAsStringLiteral(STAFF_ROLES),
  status: parseAsStringLiteral(USER_STATUSES),
};

export type UserFilters = Values<typeof userFilterParsers>;

export function toStaffUserListQuery(
  params: TableUrlParams,
  filters: UserFilters,
): StaffUserListQuery {
  const sort =
    params.sort && (SORT_FIELDS as readonly string[]).includes(params.sort)
      ? (params.sort as StaffUserListQuery["sort"])
      : "createdAt";

  return {
    page: params.page,
    pageSize: params.pageSize,
    q: params.q || undefined,
    sort,
    order: params.order === "asc" ? "asc" : "desc",
    role: filters.role ?? undefined,
    status: filters.status ?? undefined,
  };
}
