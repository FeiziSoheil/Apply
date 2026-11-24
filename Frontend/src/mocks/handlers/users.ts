import type {
  ChangePassword,
  InviteUser,
  StaffUserListQuery,
  UpdateStaffUser,
} from "@/contracts/users";
import { defineRoute, type RouteImplementations } from "../contract";
import { getDb } from "../db";
import {
  assertStaffAccount,
  countActiveAdmins,
  generateTemporaryPassword,
  toStaffUser,
} from "../domain/staff-users";
import { isStaff, requireUser } from "../domain/users";
import { apiError } from "../errors";
import {
  listSessionsForUser,
  readAccessToken,
  revokeOtherSessionsForUser,
  revokeSessionById,
  touchSession,
} from "../session";
import { emitDomainEvent } from "../domain-events";
import {
  matchesQuery,
  newId,
  noContent,
  nowIso,
  ok,
  pageResult,
  created,
  resolveSort,
  sortItems,
} from "../utils";

type IdParams = { id: string };

const STAFF_SORT = {
  name: (user: ReturnType<typeof toStaffUser>) => user.name,
  email: (user: ReturnType<typeof toStaffUser>) => user.email,
  role: (user: ReturnType<typeof toStaffUser>) => user.role,
  status: (user: ReturnType<typeof toStaffUser>) => user.status,
  lastLoginAt: (user: ReturnType<typeof toStaffUser>) =>
    user.lastLoginAt ?? "",
  createdAt: (user: ReturnType<typeof toStaffUser>) => user.createdAt,
};

export const userHandlers: RouteImplementations = {
  listStaffUsers: defineRoute<{ query: StaffUserListQuery }>(({ query }) => {
    const staff = getDb()
      .users.filter((user) => isStaff(user) && Boolean(user.email))
      .map(toStaffUser);

    let filtered = staff;
    if (query.role) {
      filtered = filtered.filter((user) => user.role === query.role);
    }
    if (query.status) {
      filtered = filtered.filter((user) => user.status === query.status);
    }
    if (query.q) {
      filtered = filtered.filter((user) =>
        matchesQuery(query.q, [user.name, user.email, user.role]),
      );
    }

    const { sort, order } = resolveSort(query, {
      sort: "createdAt",
      order: "desc",
    });
    const sorted = sortItems(filtered, sort, order, STAFF_SORT);
    return pageResult(sorted, query);
  }),

  inviteStaffUser: defineRoute<{ body: InviteUser }>(({ body }) => {
    const db = getDb();
    const taken = db.users.find(
      (entry) => entry.email?.toLowerCase() === body.email.toLowerCase(),
    );
    if (taken) {
      throw apiError.conflict("این ایمیل قبلاً ثبت شده است", {
        email: ["این ایمیل قبلاً ثبت شده است"],
      });
    }
    const now = nowIso();
    const temporaryPassword = generateTemporaryPassword();
    const createdUser = db.users.insert({
      id: newId(),
      name: body.name,
      email: body.email,
      role: body.role,
      permissions: [],
      password: temporaryPassword,
      status: "active",
      lastLoginAt: null,
      createdAt: now,
      updatedAt: now,
    });
    emitDomainEvent(db, {
      actorId: null,
      action: "create",
      entityType: "user",
      entityId: createdUser.id,
      diff: {
        before: null,
        after: { name: body.name, email: body.email, role: body.role },
      },
    });
    return created({
      user: toStaffUser(createdUser),
      temporaryPassword,
    });
  }),

  updateStaffUser: defineRoute<{ params: IdParams; body: UpdateStaffUser }>(
    ({ user, params, body }) => {
      const actor = requireUser(user);
      const db = getDb();
      const target = assertStaffAccount(db.users.get(params.id));

      if (target.id === actor.id) {
        if (body.role !== undefined && body.role !== target.role) {
          throw apiError.conflict("نمی‌توانید نقش خودتان را تغییر دهید");
        }
        if (body.status !== undefined && body.status !== target.status) {
          throw apiError.conflict("نمی‌توانید وضعیت خودتان را تغییر دهید");
        }
      }

      const nextRole = body.role ?? target.role;
      const nextStatus = body.status ?? target.status;
      const wouldLoseAdmin =
        target.role === "admin" &&
        target.status === "active" &&
        (nextRole !== "admin" || nextStatus !== "active");

      if (wouldLoseAdmin && countActiveAdmins(db.users.all(), target.id) === 0) {
        throw apiError.conflict(
          "نمی‌توان آخرین مدیر فعال را غیرفعال یا از نقش مدیریت خارج کرد",
        );
      }

      const updated = db.users.update(target.id, {
        ...(body.role ? { role: body.role } : {}),
        ...(body.status ? { status: body.status } : {}),
        updatedAt: nowIso(),
      });
      emitDomainEvent(db, {
        actorId: actor.id,
        action:
          body.role !== undefined && body.role !== target.role
            ? "permission_change"
            : "update",
        entityType: "user",
        entityId: target.id,
        diff: {
          before: { role: target.role, status: target.status },
          after: { role: nextRole, status: nextStatus },
        },
      });
      return ok(toStaffUser(updated));
    },
  ),

  resetStaffUserPassword: defineRoute<{ params: IdParams }>(({ user, params }) => {
    const actor = requireUser(user);
    const db = getDb();
    const target = assertStaffAccount(db.users.get(params.id));
    const temporaryPassword = generateTemporaryPassword();
    db.users.update(target.id, {
      password: temporaryPassword,
      updatedAt: nowIso(),
    });
    emitDomainEvent(db, {
      actorId: actor.id,
      action: "update",
      entityType: "user",
      entityId: target.id,
      diff: {
        before: { password: "••••" },
        after: { password: "••••" },
      },
    });
    return ok({ temporaryPassword });
  }),

  listMySessions: defineRoute(({ user, request }) => {
    const current = requireUser(user);
    const token = readAccessToken(request);
    touchSession(token);
    // Ensure the current request has a session row (relaxed auth / restored tokens)
    const sessions = listSessionsForUser(current.id, token);
    if (sessions.length === 0 && token) {
      const now = nowIso();
      return ok([
        {
          id: newId(),
          createdAt: now,
          lastSeenAt: now,
          ipAddress: "127.0.0.1",
          userAgent: request.headers.get("user-agent") ?? "Apply Mock Client",
          current: true,
        },
      ]);
    }
    return ok(
      sessions.map(({ id, createdAt, lastSeenAt, ipAddress, userAgent, current: isCurrent }) => ({
        id,
        createdAt,
        lastSeenAt,
        ipAddress,
        userAgent,
        current: isCurrent,
      })),
    );
  }),

  revokeMySession: defineRoute<{ params: IdParams }>(({ user, params }) => {
    const current = requireUser(user);
    revokeSessionById(current.id, params.id);
    return noContent();
  }),

  revokeOtherSessions: defineRoute(({ user, request }) => {
    const current = requireUser(user);
    const token = readAccessToken(request);
    revokeOtherSessionsForUser(current.id, token);
    return noContent();
  }),

  changeMyPassword: defineRoute<{ body: ChangePassword }>(({ user, body }) => {
    const current = requireUser(user);
    if (!isStaff(current) || !current.password) {
      throw apiError.forbidden("تغییر رمز برای این حساب پشتیبانی نمی‌شود");
    }
    if (current.password !== body.currentPassword) {
      throw apiError.invalidField("currentPassword", "رمز عبور فعلی اشتباه است");
    }
    getDb().users.update(current.id, {
      password: body.newPassword,
      updatedAt: nowIso(),
    });
    return noContent();
  }),
};
