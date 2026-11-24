import type { AdminStatsQuery } from "@/contracts/stats";
import { defineRoute, type RouteImplementations } from "../contract";
import { getDb } from "../db";
import { computeAdminStats, scopeStatsSources } from "../domain/stats";
import { requireUser } from "../domain/users";
import { ok } from "../utils";

export const statsHandlers: RouteImplementations = {
  getAdminStats: defineRoute<{ query: AdminStatsQuery }>(({ query, user }) => {
    const staff = requireUser(user);
    const db = getDb();
    const scoped = scopeStatsSources(staff, {
      leads: db.leads.all(),
      activities: db.activities.all(),
      bookings: db.bookings.all(),
      cases: db.cases.all(),
    });
    return ok(computeAdminStats(scoped, query.rangeDays));
  }),
};
