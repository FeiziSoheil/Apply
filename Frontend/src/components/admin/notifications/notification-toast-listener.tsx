"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useSession } from "@/components/auth/auth-provider";
import { useNotificationFeed } from "@/features/notifications/queries";
import { getNotificationTypeMeta } from "@/lib/crm/notification-types";

const SEEN_STORAGE_KEY = "apply.notifications.seenIds";

function loadSeenIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = sessionStorage.getItem(SEEN_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === "string"));
  } catch {
    return new Set();
  }
}

function persistSeenIds(ids: Set<string>) {
  try {
    const trimmed = [...ids].slice(-200);
    sessionStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    /* ignore quota */
  }
}

/**
 * Shows a toast when a new unread notification arrives while the user is on
 * the page. Already-seen IDs (sessionStorage) never toast again.
 */
export function NotificationToastListener() {
  const { status, user } = useSession();
  const enabled = status === "authenticated" && Boolean(user);
  const feedQuery = useNotificationFeed(8, { enabled });
  const primed = useRef(false);
  const seen = useRef<Set<string>>(new Set());

  useEffect(() => {
    seen.current = loadSeenIds();
  }, []);

  useEffect(() => {
    const items = feedQuery.data?.items;
    if (!items) return;

    if (!primed.current) {
      for (const item of items) seen.current.add(item.id);
      persistSeenIds(seen.current);
      primed.current = true;
      return;
    }

    let changed = false;
    for (const item of items) {
      if (seen.current.has(item.id)) continue;
      seen.current.add(item.id);
      changed = true;
      if (item.readAt) continue;
      const meta = getNotificationTypeMeta(item.type);
      toast(item.title, {
        description: item.body,
        icon: <meta.Icon className="size-4" aria-hidden />,
      });
    }
    if (changed) persistSeenIds(seen.current);
  }, [feedQuery.data?.items]);

  return null;
}
