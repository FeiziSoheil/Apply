"use client";

import { useMemo } from "react";
import { useSession } from "@/components/auth/auth-provider";
import { AREA_ROLES, type AuthArea } from "@/lib/auth/routes";
import { filterByPermission } from "@/lib/rbac/nav";
import { NAV_CONFIG, type NavGroup } from "./nav-config";

/**
 * Menu groups of `area` for the signed-in user (RBAC filtering):
 * - entries whose permission the user lacks are removed,
 * - groups left empty (and `hidden` groups) are dropped,
 * - nested `children` are never listed here (sidebar / command palette),
 * - a user of another role gets no menu at all (the 403 page is shown instead).
 *
 * Sidebar, mobile sheet and command palette all read from here, so they can
 * never disagree about what a user may see.
 */
export function useVisibleGroups(area: AuthArea): NavGroup[] {
  const { user } = useSession();

  return useMemo(() => {
    if (!user || !AREA_ROLES[area].includes(user.role)) return [];
    return NAV_CONFIG[area]
      .filter((group) => !group.hidden)
      .map((group) => ({
        ...group,
        // Strip nested children so menus stay flat (e.g. blog categories)
        items: filterByPermission(group.items, user).map(
          ({ children: _children, ...item }) => item,
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [area, user]);
}
