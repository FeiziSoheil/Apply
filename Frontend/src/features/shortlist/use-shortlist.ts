"use client";

import { useCallback, useContext, useEffect, useState } from "react";
import { toast } from "sonner";
import { QueryClientContext } from "@tanstack/react-query";
import { studentPanelApi } from "@/features/student-panel/api";
import { studentPanelKeys } from "@/features/student-panel/keys";
import { getSessionAdapter } from "@/lib/api/session-adapter";

export const GUEST_SHORTLIST_KEY = "apply:guest-shortlist";
export const SHORTLIST_CHANGE_EVENT = "apply:shortlist-updated";

export type ShortlistTarget = {
  programId?: string | null;
  universityId?: string | null;
  countrySlug?: string | null;
  title?: string;
};

export function getGuestShortlist(): ShortlistTarget[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(GUEST_SHORTLIST_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveGuestShortlist(items: ShortlistTarget[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(GUEST_SHORTLIST_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event(SHORTLIST_CHANGE_EVENT));
  } catch (e) {
    console.error("Failed to save guest shortlist:", e);
  }
}

export async function mergeGuestShortlist(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const items = getGuestShortlist();
    if (items.length === 0) return;
    await studentPanelApi.mergeShortlist({
      items: items.map((item) => ({
        programId: item.programId ?? undefined,
        universityId: item.universityId ?? undefined,
        countrySlug: item.countrySlug ?? undefined,
      })),
    });
    localStorage.removeItem(GUEST_SHORTLIST_KEY);
    window.dispatchEvent(new Event(SHORTLIST_CHANGE_EVENT));
  } catch (err) {
    console.error("Failed to merge guest shortlist:", err);
  }
}

function matchesTarget(a: ShortlistTarget, b: ShortlistTarget): boolean {
  if (a.programId && b.programId) return a.programId === b.programId;
  if (a.universityId && b.universityId)
    return a.universityId === b.universityId;
  if (a.countrySlug && b.countrySlug)
    return a.countrySlug === b.countrySlug;
  return false;
}

export function isUserAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  const adapter = getSessionAdapter();
  if (adapter.kind === "mock-bearer") {
    return Boolean(adapter.getAccessToken());
  }
  return (
    document.cookie.includes("mock_session") ||
    document.cookie.includes("session")
  );
}

export function useIsFavorite(target: ShortlistTarget) {
  const [isFav, setIsFav] = useState(() => {
    if (typeof window === "undefined") return false;
    const items = getGuestShortlist();
    return items.some((item) => matchesTarget(item, target));
  });
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useContext(QueryClientContext);

  const sync = useCallback(() => {
    const authed = isUserAuthenticated();
    if (!authed) {
      const items = getGuestShortlist();
      setIsFav(items.some((item) => matchesTarget(item, target)));
      return;
    }

    // Check React Query cache if available
    if (queryClient) {
      const cached = queryClient.getQueryData<{ items: ShortlistTarget[] }>(
        studentPanelKeys.shortlist(),
      );
      if (cached?.items) {
        setIsFav(cached.items.some((item) => matchesTarget(item, target)));
        return;
      }
    }

    // Check guest list fallback
    const guestItems = getGuestShortlist();
    if (guestItems.some((item) => matchesTarget(item, target))) {
      setIsFav(true);
      return;
    }

    // In-browser fetch if authed
    if (typeof window !== "undefined") {
      setIsLoading(true);
      studentPanelApi
        .getShortlist()
        .then((res) => {
          if (queryClient) {
            queryClient.setQueryData(studentPanelKeys.shortlist(), res);
          }
          setIsFav(res.items.some((item) => matchesTarget(item, target)));
        })
        .catch(() => {})
        .finally(() => setIsLoading(false));
    }
  }, [target, queryClient]);

  useEffect(() => {
    const handler = () => sync();
    window.addEventListener(SHORTLIST_CHANGE_EVENT, handler);
    const timer = setTimeout(() => {
      sync();
    }, 0);
    return () => {
      clearTimeout(timer);
      window.removeEventListener(SHORTLIST_CHANGE_EVENT, handler);
    };
  }, [sync]);

  return { isFavorite: isFav, isLoading };
}

export function useToggleFavorite() {
  const queryClient = useContext(QueryClientContext);

  return useCallback(
    async (target: ShortlistTarget, currentFavorite: boolean) => {
      const authed = isUserAuthenticated();

      if (authed) {
        try {
          await studentPanelApi.putShortlist({
            programId: target.programId ?? undefined,
            universityId: target.universityId ?? undefined,
            countrySlug: target.countrySlug ?? undefined,
          });

          if (queryClient) {
            await queryClient.invalidateQueries({
              queryKey: studentPanelKeys.shortlist(),
            });
            await queryClient.invalidateQueries({
              queryKey: studentPanelKeys.shortlistCompare(),
            });
          }
          toast.success(
            currentFavorite
              ? "از علاقه‌مندی‌ها حذف شد"
              : "به علاقه‌مندی‌ها اضافه شد",
          );
          window.dispatchEvent(new Event(SHORTLIST_CHANGE_EVENT));
        } catch {
          toast.error("خطا در به‌روزرسانی علاقه‌مندی‌ها");
        }
      } else {
        const current = getGuestShortlist();
        let updated: ShortlistTarget[];
        if (currentFavorite) {
          updated = current.filter((item) => !matchesTarget(item, target));
          toast.success("از علاقه‌مندی‌ها حذف شد");
        } else {
          updated = [...current, target];
          toast.success("به علاقه‌مندی‌ها اضافه شد");
        }
        saveGuestShortlist(updated);
      }
    },
    [queryClient],
  );
}
